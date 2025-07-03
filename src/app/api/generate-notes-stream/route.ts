import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { STRUCTURED_NOTES_PROMPT } from '@/lib/prompts'

// 流式响应辅助函数
function createSSEMessage(data: any): string {
  return `data: ${JSON.stringify(data)}\n\n`
}

export async function POST(request: NextRequest) {
  try {
    // 检查请求体是否存在
    const body = await request.text()
    if (!body || body.trim() === '') {
      return new Response(JSON.stringify({ error: '请求体为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 解析JSON
    let parsedBody
    try {
      parsedBody = JSON.parse(body)
    } catch (parseError) {
      console.error('JSON解析错误:', parseError, '请求体:', body)
      return new Response(JSON.stringify({ error: 'JSON格式错误' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const { content } = parsedBody

    if (!content) {
      return new Response(JSON.stringify({ error: '缺少内容' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 检查必要的环境变量
    if (!process.env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: '未配置 OpenAI API 密钥' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!process.env.OPENAI_MODEL) {
      return new Response(JSON.stringify({ error: '未配置 OPENAI_MODEL，请在 .env 文件中设置' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 创建流式响应
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        // 直接调用 generateNotesStream，它内部已经处理了所有错误
        await generateNotesStream(content, controller, encoder)
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
    console.error('API错误:', error)
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function generateNotesStream(
  content: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder
) {
  let isClosed = false
  
  const safeEnqueue = (data: Uint8Array) => {
    if (!isClosed) {
      try {
        controller.enqueue(data)
      } catch (error) {
        console.warn('Controller 已关闭，跳过消息发送')
        isClosed = true
      }
    }
  }
  
  const safeClose = () => {
    if (!isClosed) {
      try {
        controller.close()
        isClosed = true
      } catch (error) {
        console.warn('Controller 已关闭')
        isClosed = true
      }
    }
  }
  
  try {
    // 创建 OpenAI 客户端
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    })

    // 使用 OpenAI 流式 API
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL!,
      messages: [
        {
          role: 'system',
          content: STRUCTURED_NOTES_PROMPT
        },
        {
          role: 'user',
          content: `请将以下内容整理成结构化笔记：\n\n${content}`
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
      stream: true,
    })

    // 处理流式响应
    for await (const chunk of stream) {
      if (isClosed) break // 如果已关闭，停止处理
      
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        safeEnqueue(encoder.encode(createSSEMessage({ 
          type: 'content', 
          content 
        })))
      }
    }

    // 发送完成信号
    safeEnqueue(encoder.encode(createSSEMessage({ type: 'complete' })))
    safeClose()
  } catch (error) {
    console.error('生成笔记流失败:', error)
    
    // 安全地发送错误信息到客户端
    safeEnqueue(encoder.encode(createSSEMessage({ 
      type: 'error', 
      error: error instanceof Error ? error.message : '生成笔记失败',
      details: error instanceof Error ? error.stack : String(error)
    })))
    
    safeClose()
    // 不再重新抛出错误，因为外层还会处理
  }
}