import { NextRequest } from 'next/server'
import { analyzeDocumentStream } from '@/lib/openai'
import { detectMediaType, MediaProcessorFactory, initializeMediaProcessors } from '@/services/media'
import { MediaType } from '@/types/media'

// 初始化媒体处理器
initializeMediaProcessors()

export async function POST(request: NextRequest) {
  try {
    const { content, fileType, filename, mediaType } = await request.json()

    if (!content || !fileType) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 检查 API 密钥
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return new Response(
        JSON.stringify({ error: '请在 .env 文件中配置 OPENAI_API_KEY' }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // 创建SSE响应
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送开始事件
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'start',
            message: '开始分析文档...'
          })}\n\n`))

          // 确定媒体类型
          let detectedMediaType: MediaType = MediaType.TEXT
          if (mediaType && Object.values(MediaType).includes(mediaType)) {
            detectedMediaType = mediaType
          } else {
            const ext = fileType.toLowerCase()
            switch (ext) {
              case 'md':
              case 'markdown':
                detectedMediaType = MediaType.MARKDOWN
                break
              case 'pdf':
                detectedMediaType = MediaType.PDF
                break
              default:
                detectedMediaType = MediaType.TEXT
            }
          }

          // 使用真正的流式分析
          for await (const event of analyzeDocumentStream(content, fileType)) {
            switch (event.type) {
              case 'progress':
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'progress',
                  message: event.data.message,
                  progress: event.data.progress
                })}\n\n`))
                break
                
              case 'summary':
                // 处理文档导读
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'summary',
                  summary: event.data.summary
                })}\n\n`))
                break
                
              case 'section':
                // 转换为统一的媒体格式
                const section = {
                  ...event.data.section,
                  mediaType: detectedMediaType,
                  location: {
                    textAnchor: event.data.section.location.textAnchor,
                    charPosition: event.data.section.location.charPosition
                  }
                }
                
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'section',
                  section: section,
                  index: event.data.index,
                  total: event.data.total
                })}\n\n`))
                break
                
              case 'complete':
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'complete',
                  message: event.data.message,
                  sectionsCount: event.data.sectionsCount,
                  mediaType: detectedMediaType,
                  documentSummary: event.data.documentSummary
                })}\n\n`))
                break
            }
          }

          controller.close()

        } catch (error) {
          console.error('流式分析错误:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : '分析失败'
          })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })

  } catch (error) {
    console.error('请求处理错误:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : '请求处理失败'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}