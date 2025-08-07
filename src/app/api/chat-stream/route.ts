import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { getAskSystemPrompt } from '@/lib/prompts'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
})

export async function POST(request: NextRequest) {
  try {
    const { message, context, history } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // 检查必要的环境变量
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
    }

    if (!process.env.OPENAI_MODEL) {
      return NextResponse.json({ error: 'OPENAI_MODEL not configured in .env file' }, { status: 500 })
    }

    // 使用集中管理的系统提示词
    const askSystemPrompt = getAskSystemPrompt(context || '')

    // 构建消息历史
    const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [
      {
        role: 'system',
        content: askSystemPrompt
      }
    ]

    // 添加历史消息
    if (history && Array.isArray(history)) {
      history.forEach((msg: any) => {
        if (msg.role && msg.content && ['user', 'assistant'].includes(msg.role)) {
          messages.push({
            role: msg.role,
            content: msg.content
          })
        }
      })
    }

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: message
    })

    // 创建流式响应
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL!,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    })

    // 创建可读流
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              const data = `data: ${JSON.stringify({ content })}\n\n`
              controller.enqueue(encoder.encode(data))
            }
          }
          
          // 发送结束标志
          const endData = `data: ${JSON.stringify({ type: 'complete' })}\n\n`
          controller.enqueue(encoder.encode(endData))
          controller.close()
        } catch (error) {
          console.error('Stream error:', error)
          const errorData = `data: ${JSON.stringify({ error: 'Stream processing failed' })}\n\n`
          controller.enqueue(encoder.encode(errorData))
          controller.close()
        }
      }
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}