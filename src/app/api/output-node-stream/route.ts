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
      question, 
      contextCards = [], 
      nodeId,
      conversationHistory = [],
      nodeType = 'ai-chat'
    } = body

    console.log('🚀 [输出节点API] 收到请求:', {
      question: question?.slice(0, 100) + '...',
      contextCardsSize: contextCards.length,
      nodeId,
      nodeType,
      hasHistory: conversationHistory.length > 0,
      contextCardsSample: contextCards.slice(0, 3).map((note: any) => ({
        id: note.id,
        title: note.title,
        summary: note.summary?.slice(0, 50) + '...'
      }))
    })

    // 创建流式响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送开始事件
          controller.enqueue(encoder.encode(StreamEncoder.encode('start', { nodeId, question })))

          // 直接使用提供的上下文卡片进行对话
          console.log('🤖 [AI对话] 开始生成回答')
          controller.enqueue(encoder.encode(StreamEncoder.encode('status', { 
            status: 'generating', 
            message: '正在生成回答...' 
          })))

          await generateAnswerWithContext(
            question, 
            contextCards, 
            conversationHistory, 
            nodeType,
            controller, 
            encoder
          )

          // 发送完成事件
          controller.enqueue(encoder.encode(StreamEncoder.encode('complete', { 
            nodeId, 
            contextUsed: contextCards.length 
          })))

        } catch (error) {
          console.error('❌ [输出节点API] 处理失败:', error)
          controller.enqueue(encoder.encode(StreamEncoder.error(
            error instanceof Error ? error.message : '处理请求时发生未知错误'
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
    console.error('❌ [输出节点API] 初始化失败:', error)
    return NextResponse.json(
      { error: '请求处理失败' },
      { status: 500 }
    )
  }
}


// 基于上下文生成回答
async function generateAnswerWithContext(
  question: string,
  contextCards: any[],
  conversationHistory: any[],
  nodeType: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
) {
  
  // 构建上下文
  const contextContent = contextCards.map(card => `
标题：${card.title}
摘要：${card.summary || '暂无摘要'}
内容：${card.content ? card.content.slice(0, 500) + '...' : '暂无详细内容'}
标签：${card.tags?.join(', ') || '无'}
`).join('\n---\n')

  // 构建对话历史
  const historyContent = conversationHistory
    .slice(-4) // 只保留最近4轮对话
    .map((msg: any) => `${msg.role === 'user' ? '用户' : 'AI'}：${msg.content}`)
    .join('\n')

  // 根据节点类型选择系统提示
  const systemPrompts = {
    'ai-chat': `你是一个专业的知识助手。基于用户提供的知识卡片内容和对话历史，为用户的问题提供准确、有帮助的回答。

回答要求：
1. 充分利用提供的知识卡片内容
2. 考虑对话历史的上下文
3. 保持客观、准确的语调
4. 提供具体、可操作的建议
5. 如果知识卡片中没有相关信息，请诚实说明并提供通用建议
6. 适当引用知识卡片中的关键信息`,
    
    'html-page': '基于知识卡片内容生成完整的HTML网页...',
    'xiaohongshu': '基于知识卡片内容生成小红书风格的图文内容...'
  }

  const systemPrompt = systemPrompts[nodeType as keyof typeof systemPrompts] || systemPrompts['ai-chat']

  const answerPrompt = `
${contextCards.length > 0 ? `可用知识卡片：\n${contextContent}\n` : ''}

${conversationHistory.length > 0 ? `对话历史：\n${historyContent}\n` : ''}

用户问题：${question}

请基于上述信息回答用户的问题。`

  try {
    const answerResponse = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: answerPrompt }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 2000
    })

    // 流式发送回答内容
    let fullAnswer = ''
    for await (const chunk of answerResponse) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        fullAnswer += content
        console.log('📤 [API] 发送内容片段:', { 
          contentLength: content.length,
          totalLength: fullAnswer.length,
          preview: content.slice(0, 50) + '...'
        })
        controller.enqueue(encoder.encode(StreamEncoder.encode('answer_content', { content })))
      }
    }

    console.log('✅ [生成回答] 完成:', {
      answerLength: fullAnswer.length,
      contextCardsUsed: contextCards.length
    })

  } catch (error) {
    console.error('❌ [生成回答] 失败:', error)
    throw error
  }
}