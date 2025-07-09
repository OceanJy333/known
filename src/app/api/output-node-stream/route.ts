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
      knowledgeBase = [], 
      contextCards = [], 
      nodeId,
      conversationHistory = [],
      nodeType = 'ai-chat'
    } = body

    console.log('🚀 [输出节点API] 收到请求:', {
      question: question?.slice(0, 100) + '...',
      knowledgeBaseSize: knowledgeBase.length,
      contextCardsSize: contextCards.length,
      nodeId,
      nodeType,
      hasHistory: conversationHistory.length > 0,
      // 添加更详细的知识库信息
      knowledgeBaseSample: knowledgeBase.slice(0, 3).map((note: any) => ({
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

          let recalledCards: any[] = []

          // 第一阶段：召回相关卡片（如果没有提供上下文卡片）
          if (contextCards.length === 0 && knowledgeBase.length > 0) {
            console.log('📋 [第一阶段] 开始召回相关卡片')
            controller.enqueue(encoder.encode(StreamEncoder.encode('status', { 
              status: 'recalling', 
              message: '正在召回相关内容...' 
            })))

            recalledCards = await recallRelevantCards(question, knowledgeBase, controller, encoder)
            
            console.log('✅ [第一阶段] 召回完成:', {
              recalledCount: recalledCards.length,
              recalledIds: recalledCards.map(c => c.id)
            })
          } else {
            // 使用提供的上下文卡片
            recalledCards = contextCards
            console.log('📝 [跳过召回] 使用提供的上下文卡片:', contextCards.length)
          }

          // 第二阶段：基于上下文生成回答
          console.log('🤖 [第二阶段] 开始生成回答')
          controller.enqueue(encoder.encode(StreamEncoder.encode('status', { 
            status: 'generating', 
            message: '正在生成回答...' 
          })))

          await generateAnswerWithContext(
            question, 
            recalledCards, 
            conversationHistory, 
            nodeType,
            controller, 
            encoder
          )

          // 发送完成事件
          controller.enqueue(encoder.encode(StreamEncoder.encode('complete', { 
            nodeId, 
            recalledCards: recalledCards.map(card => card.id),
            contextUsed: recalledCards.length 
          })))
          controller.enqueue(encoder.encode(StreamEncoder.complete()))

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

// 第一阶段：召回相关卡片
async function recallRelevantCards(
  question: string, 
  knowledgeBase: any[], 
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder
): Promise<any[]> {
  
  // 优化知识库数据，避免token超限
  const optimizedKnowledgeBase = knowledgeBase
    .slice(0, 50) // 限制数量
    .map(note => ({
      id: note.id,
      title: note.title,
      summary: (note.summary || '').slice(0, 200),
      tags: note.tags,
      category: note.category
    }))

  const matchingPrompt = `作为知识检索专家，请从用户的笔记库中找出与问题最相关的笔记。

用户问题：${question}

笔记库：
${JSON.stringify(optimizedKnowledgeBase, null, 2)}

请分析每个笔记与问题的相关度，返回最相关的5个笔记ID及其相关度评分（0-1）。

返回格式（必须是有效的JSON）：
{
  "matches": [
    {"id": "note-id", "relevance": 0.95, "reason": "相关原因"}
  ]
}`

  try {
    const matchingResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: matchingPrompt }],
      temperature: 0.1,
      max_tokens: 1000
    })

    const matchingResult = matchingResponse.choices[0]?.message?.content
    if (!matchingResult) {
      throw new Error('AI匹配返回为空')
    }

    // 解析匹配结果
    let matchingData
    try {
      matchingData = JSON.parse(matchingResult)
    } catch (e) {
      console.warn('⚠️ [召回] JSON解析失败，尝试提取:', matchingResult)
      // 尝试提取JSON部分
      const jsonMatch = matchingResult.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        matchingData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('无法解析AI返回的匹配结果')
      }
    }

    // 发送召回的卡片
    const recalledCards = matchingData.matches
      ?.filter((match: any) => match.relevance > 0.6) // 只保留相关度高的
      ?.map((match: any) => {
        const originalNote = knowledgeBase.find(note => note.id === match.id)
        return originalNote ? { ...originalNote, relevance: match.relevance, reason: match.reason } : null
      })
      ?.filter(Boolean) || []

    // 发送召回结果
    console.log('📤 [召回] 发送召回结果到前端:', {
      recalledCardsCount: recalledCards.length,
      recalledCardsSample: recalledCards.slice(0, 3).map((card: any) => ({
        id: card.id,
        title: card.title,
        relevance: card.relevance
      })),
      searchStats: {
        totalNotesSearched: knowledgeBase.length,
        notesFound: recalledCards.length,
        averageRelevance: recalledCards.length > 0 
          ? (recalledCards.reduce((sum: number, card: any) => sum + card.relevance, 0) / recalledCards.length).toFixed(2)
          : '0'
      }
    })
    
    // 打印到后端终端的关键信息
    console.log('\n🔥 [后端终端] 召回卡片发送确认:')
    console.log('   - 卡片数量:', recalledCards.length)
    console.log('   - 卡片ID列表:', recalledCards.map((c: any) => c.id))
    console.log('   - 卡片标题:', recalledCards.map((c: any) => c.title))
    console.log('   - 即将发送的事件类型: recalled_cards')
    console.log('   - 流式传输状态: 正在发送...\n')
    
    controller.enqueue(encoder.encode(StreamEncoder.encode('recalled_cards', {
      cards: recalledCards,
      searchStats: {
        totalNotesSearched: knowledgeBase.length,
        notesFound: recalledCards.length,
        averageRelevance: recalledCards.length > 0 
          ? (recalledCards.reduce((sum: number, card: any) => sum + card.relevance, 0) / recalledCards.length).toFixed(2)
          : '0'
      }
    })))

    return recalledCards

  } catch (error) {
    console.error('❌ [召回] 智能匹配失败:', error)
    
    // 回退到关键词匹配
    console.log('🔄 [召回] 回退到关键词匹配')
    const fallbackCards = knowledgeBase
      .filter(note => {
        const content = `${note.title} ${note.summary || ''} ${note.tags?.join(' ') || ''}`.toLowerCase()
        const questionWords = question.toLowerCase().split(' ')
        return questionWords.some(word => word.length > 2 && content.includes(word))
      })
      .slice(0, 3)
      .map(note => ({ ...note, relevance: 0.7, reason: '关键词匹配' }))

    controller.enqueue(encoder.encode(StreamEncoder.encode('recalled_cards', {
      cards: fallbackCards,
      searchStats: {
        totalNotesSearched: knowledgeBase.length,
        notesFound: fallbackCards.length,
        averageRelevance: '0.70'
      },
      fallback: true
    })))

    return fallbackCards
  }
}

// 第二阶段：基于上下文生成回答
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
      model: 'gpt-4o-mini',
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