import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: process.env.OPENAI_BASE_URL
})

// 流式响应编码器
class StreamEncoder {
  static encode(type: string, data: any): string {
    return `data: ${JSON.stringify({ type, data, timestamp: new Date().toISOString() })}\n\n`
  }

  static error(message: string): string {
    return `data: ${JSON.stringify({ type: 'error', message, timestamp: new Date().toISOString() })}\n\n`
  }

  static complete(): string {
    return `data: ${JSON.stringify({ type: 'complete', timestamp: new Date().toISOString() })}\n\n`
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      nodeId,
      knowledgeCards = [], // 知识卡片数组
      template = 'modern', // 模板类型
      regenerate = false // 是否重新生成
    } = body

    console.log('🎨 [SVG卡片API] 收到请求:', {
      nodeId,
      cardsCount: knowledgeCards.length,
      template,
      regenerate,
      cardsSample: knowledgeCards.slice(0, 2).map((card: any) => ({
        id: card.id,
        title: card.title?.slice(0, 30) + '...'
      }))
    })

    // 验证输入
    if (!nodeId) {
      return NextResponse.json({ error: '缺少节点ID' }, { status: 400 })
    }

    if (!knowledgeCards || knowledgeCards.length === 0) {
      return NextResponse.json({ error: '需要至少一个知识卡片' }, { status: 400 })
    }

    // 创建流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送开始事件
          controller.enqueue(encoder.encode(StreamEncoder.encode('start', { 
            nodeId, 
            template,
            cardsCount: knowledgeCards.length 
          })))

          // 第一阶段：提取结构化内容
          console.log('📝 [第一阶段] 开始提取结构化内容')
          controller.enqueue(encoder.encode(StreamEncoder.encode('status', { 
            status: 'extracting', 
            message: '正在分析知识内容...' 
          })))

          const extractedContent = await extractStructuredContent(knowledgeCards, controller, encoder)
          
          console.log('✅ [第一阶段] 内容提取完成:', extractedContent)

          // 第二阶段：生成SVG卡片
          console.log('🎨 [第二阶段] 开始生成SVG卡片')
          controller.enqueue(encoder.encode(StreamEncoder.encode('status', { 
            status: 'generating', 
            message: '正在生成精美卡片...' 
          })))

          const svgContent = await generateSVGCard(extractedContent, template, controller, encoder)

          // 发送完成事件
          controller.enqueue(encoder.encode(StreamEncoder.encode('complete', { 
            nodeId,
            extractedContent,
            svgContent,
            template
          })))

        } catch (error) {
          console.error('❌ [SVG卡片API] 处理失败:', error)
          controller.enqueue(encoder.encode(StreamEncoder.error(
            error instanceof Error ? error.message : '生成SVG卡片时发生未知错误'
          )))
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('❌ [SVG卡片API] 初始化失败:', error)
    return NextResponse.json(
      { error: '请求处理失败' },
      { status: 500 }
    )
  }
}

// 第一阶段：提取结构化内容
async function extractStructuredContent(
  knowledgeCards: any[], 
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<any> {
  
  // 合并所有卡片内容
  const combinedContent = knowledgeCards.map(card => `
标题：${card.title || '无标题'}
摘要：${card.summary || '无摘要'}
内容：${card.content ? card.content.slice(0, 500) + '...' : '无详细内容'}
关键词：${card.keyPoints?.join(', ') || ''}
标签：${card.tags?.join(', ') || ''}
`).join('\n---\n')

  const extractPrompt = `作为专业的知识整理专家，请从以下知识内容中提取结构化信息，用于生成精美的知识卡片。

知识内容：
${combinedContent}

请提取以下信息：
1. 标题：一个吸引人的核心主题（10-20字）
2. 摘要：用一句话概括最重要的信息（30-50字）
3. 关键要点：3-5个最重要的知识点（每个10-20字）
4. 标签：2-4个内容分类关键词

返回格式（必须是有效的JSON）：
{
  "title": "核心主题标题",
  "summary": "一句话核心概括",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "tags": ["标签1", "标签2", "标签3"]
}`

  try {
    const extractResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: extractPrompt }],
      temperature: 0.3,
      max_tokens: 800
    })

    const extractResult = extractResponse.choices[0]?.message?.content
    if (!extractResult) {
      throw new Error('AI提取返回为空')
    }

    // 解析提取结果
    let extractedData
    try {
      extractedData = JSON.parse(extractResult)
    } catch (e) {
      console.warn('⚠️ [内容提取] JSON解析失败，尝试提取:', extractResult)
      // 尝试提取JSON部分
      const jsonMatch = extractResult.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('无法解析AI返回的提取结果')
      }
    }

    // 验证和清理数据
    const cleanedData = {
      title: extractedData.title?.slice(0, 30) || '知识卡片',
      summary: extractedData.summary?.slice(0, 100) || '暂无摘要',
      keyPoints: (extractedData.keyPoints || []).slice(0, 5).map((point: string) => point.slice(0, 30)),
      tags: (extractedData.tags || []).slice(0, 4).map((tag: string) => tag.slice(0, 10))
    }

    // 发送提取结果
    controller.enqueue(encoder.encode(StreamEncoder.encode('content_extracted', {
      extractedContent: cleanedData
    })))

    return cleanedData

  } catch (error) {
    console.error('❌ [内容提取] 失败:', error)
    
    // 回退到简单提取
    console.log('🔄 [内容提取] 回退到简单提取')
    const fallbackContent = {
      title: knowledgeCards[0]?.title?.slice(0, 20) || '知识卡片',
      summary: knowledgeCards[0]?.summary?.slice(0, 80) || '这是一个知识卡片，包含重要的学习内容',
      keyPoints: knowledgeCards.flatMap(card => card.keyPoints || []).slice(0, 4),
      tags: knowledgeCards.flatMap(card => card.tags || []).slice(0, 3)
    }

    controller.enqueue(encoder.encode(StreamEncoder.encode('content_extracted', {
      extractedContent: fallbackContent,
      fallback: true
    })))

    return fallbackContent
  }
}

// 第二阶段：生成SVG卡片
async function generateSVGCard(
  extractedContent: any,
  template: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<string> {
  
  // 动态导入模板
  const { getTemplateById, getDefaultTemplate } = await import('@/constants/svgTemplates')
  
  const selectedTemplate = getTemplateById(template) || getDefaultTemplate()
  
  try {
    // 使用模板生成SVG
    const svgContent = selectedTemplate.generate(extractedContent)
    
    // 发送SVG内容
    controller.enqueue(encoder.encode(StreamEncoder.encode('svg_generated', {
      svgContent,
      template: selectedTemplate.id
    })))

    console.log('✅ [SVG生成] 完成:', {
      template: selectedTemplate.id,
      svgLength: svgContent.length
    })

    return svgContent

  } catch (error) {
    console.error('❌ [SVG生成] 失败:', error)
    throw error
  }
}