import { NextRequest, NextResponse } from 'next/server'
import { analyzeDocument, convertSectionsToMarkdown } from '@/lib/openai'
import { detectMediaType, MediaProcessorFactory, initializeMediaProcessors } from '@/services/media'
import { MediaType } from '@/types/media'

// 初始化媒体处理器
initializeMediaProcessors()

export async function POST(request: NextRequest) {
  try {
    const { content, fileType, filename, mediaType } = await request.json()

    if (!content || !fileType) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // 检查 API 密钥
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_openai_api_key_here') {
      return NextResponse.json(
        { error: '请在 .env 文件中配置 OPENAI_API_KEY' },
        { status: 500 }
      )
    }

    // 确定媒体类型
    let detectedMediaType: MediaType
    if (mediaType && Object.values(MediaType).includes(mediaType)) {
      detectedMediaType = mediaType
    } else {
      // 根据文件扩展名推断媒体类型
      const ext = fileType.toLowerCase()
      switch (ext) {
        case 'md':
        case 'markdown':
          detectedMediaType = MediaType.MARKDOWN
          break
        case 'pdf':
          detectedMediaType = MediaType.PDF
          break
        case 'mp4':
        case 'avi':
        case 'mov':
          detectedMediaType = MediaType.VIDEO
          break
        case 'mp3':
        case 'wav':
          detectedMediaType = MediaType.AUDIO
          break
        case 'html':
        case 'htm':
          detectedMediaType = MediaType.WEBPAGE
          break
        default:
          detectedMediaType = MediaType.TEXT
      }
    }

    // 检查媒体类型是否受支持
    const processor = MediaProcessorFactory.getProcessor(detectedMediaType)
    if (!processor) {
      return NextResponse.json(
        { error: `不支持的媒体类型: ${detectedMediaType}` },
        { status: 400 }
      )
    }

    // 调用 OpenAI 分析文档（目前仍使用原有逻辑）
    const legacySections = await analyzeDocument(content, fileType)
    
    // 转换为新的媒体格式（保持向后兼容）
    const sections = legacySections.map(section => ({
      ...section,
      mediaType: detectedMediaType,
      location: {
        textAnchor: section.location.textAnchor,
        charPosition: section.location.charPosition
      }
    }))
    
    // 处理内容（目前仍使用原有逻辑）
    const markdownContent = convertSectionsToMarkdown(sections, content)

    return NextResponse.json({
      success: true,
      markdownContent,
      sections,
      filename: filename || '未命名文档',
      mediaType: detectedMediaType
    })
  } catch (error) {
    console.error('文档分析错误:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '文档分析失败',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}