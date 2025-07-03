import OpenAI from 'openai'
import { DocumentSection, MediaType, LocationInfo } from '@/types/media'
import { DOCUMENT_ANALYSIS_PROMPTS, getDocumentAnalysisUserPrompt } from '@/lib/prompts'

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
})

// 保持向后兼容的简化接口
export interface LegacyDocumentSection {
  id: string
  title: string
  level: number
  summary: string
  anchor?: string
}

// 流式分析文档函数
export async function* analyzeDocumentStream(
  content: string, 
  fileType: string
): AsyncGenerator<{ type: 'progress' | 'section' | 'complete' | 'summary', data?: any }, void, unknown> {
  try {
    // 检查必要的环境变量
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured')
    }
    
    if (!process.env.OPENAI_MODEL) {
      throw new Error('OPENAI_MODEL not configured in .env file')
    }
    // 从环境变量获取配置
    const maxContentLength = parseInt(process.env.OPENAI_MAX_CONTENT_LENGTH || '8000')
    const truncationMessage = process.env.OPENAI_TRUNCATION_MESSAGE || '...(内容过长已截断)'
    const systemPrompt = DOCUMENT_ANALYSIS_PROMPTS.system

    yield { type: 'progress', data: { message: '正在调用OpenAI API...', progress: 10 } }

    // 处理内容截断
    const truncatedContent = content.substring(0, maxContentLength) + 
      (content.length > maxContentLength ? truncationMessage : '')

    // 使用集中管理的用户提示词
    const userPrompt = getDocumentAnalysisUserPrompt(fileType, truncatedContent)

    yield { type: 'progress', data: { message: '发送分析请求...', progress: 20 } }

    // 使用流式API
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL!,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
      stream: true // 启用流式输出
    })

    yield { type: 'progress', data: { message: '正在接收AI分析结果...', progress: 30 } }

    let buffer = ''
    let sectionIndex = 0
    const sections: DocumentSection[] = []
    let documentSummary: string | null = null // 存储文档导读
    let isJsonArray = false // 检测是否为传统JSON数组格式
    let fullResponse = '' // 保存完整响应用于后备处理
    let braceCount = 0 // 跟踪花括号深度
    let inString = false // 是否在字符串中
    let escapeNext = false // 下一个字符是否被转义
    
    // 辅助函数：从buffer中提取完整的JSON对象
    const extractJsonObjects = (text: string): { objects: any[], remaining: string } => {
      const objects: any[] = []
      let startIdx = 0
      let depth = 0
      let inStr = false
      let escape = false
      
      for (let i = 0; i < text.length; i++) {
        const char = text[i]
        
        if (escape) {
          escape = false
          continue
        }
        
        if (char === '\\') {
          escape = true
          continue
        }
        
        if (char === '"' && !escape) {
          inStr = !inStr
          continue
        }
        
        if (!inStr) {
          if (char === '{') {
            if (depth === 0) startIdx = i
            depth++
          } else if (char === '}') {
            depth--
            if (depth === 0) {
              // 找到完整的JSON对象
              const jsonStr = text.substring(startIdx, i + 1)
              try {
                const obj = JSON.parse(jsonStr)
                if (obj.type === 'summary' || obj.title) { // 导读或章节对象
                  objects.push(obj)
                }
              } catch (e) {
                // JSON解析失败，继续寻找
              }
            }
          }
        }
      }
      
      // 返回剩余的未完成部分
      const remaining = depth > 0 ? text.substring(startIdx) : ''
      return { objects, remaining }
    }
    
    // 流式处理响应 - 支持多种JSON流格式
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || ''
      if (delta) {
        buffer += delta
        fullResponse += delta
        
        // 检测是否为传统JSON格式
        if (!isJsonArray && (buffer.includes('"segments"') || buffer.trimStart().startsWith('['))) {
          isJsonArray = true
          continue // 继续收集完整响应
        }
        
        // 如果是JSON数组格式，跳过流式解析
        if (isJsonArray) {
          continue
        }
        
        // 尝试提取完整的JSON对象
        const { objects, remaining } = extractJsonObjects(buffer)
        buffer = remaining
        
        // 处理提取到的对象
        for (const item of objects) {
          
          // 处理文档导读
          if (item.type === 'summary' && !documentSummary) {
            documentSummary = item.content
            
            // 流式返回导读
            yield { 
              type: 'summary', 
              data: { 
                summary: documentSummary
              } 
            }
            continue
          }
          
          // 处理章节
          if (item.title) {
            // 立即转换为标准格式并流式返回
            const section: DocumentSection = {
              id: `section-${sectionIndex + 1}`,
              title: item.title || `段落 ${sectionIndex + 1}`,
              level: item.level || 1,
              summary: item.summary || '该段落的内容总结',
              mediaType: MediaType.TEXT,
              location: {
                textAnchor: item.anchor,
                charPosition: item.startChar
              } as LocationInfo
            }
            
            sections.push(section)
            
            // 实时流式返回章节
            yield { 
              type: 'section', 
              data: { 
                section, 
                index: sectionIndex, 
                total: -1 // 总数未知，因为是流式的
              } 
            }
            
            sectionIndex++
            
            // 更新进度
            yield { 
              type: 'progress', 
              data: { 
                message: `已识别 ${sectionIndex} 个章节...`, 
                progress: Math.min(30 + (sectionIndex * 10), 90)
              } 
            }
          }
        }
      }
    }
    
    // 如果检测到传统JSON格式，进行后备处理
    if (isJsonArray && sections.length === 0) {
      try {
        // 清理响应
        let cleanedResult = fullResponse.trim()
        cleanedResult = cleanedResult.replace(/^```json\s*/i, '').replace(/\s*```$/i, '')
        
        let parsedResult
        // 尝试解析完整JSON
        try {
          parsedResult = JSON.parse(cleanedResult)
          if (!Array.isArray(parsedResult)) {
            parsedResult = parsedResult.segments || parsedResult.sections || parsedResult.toc || parsedResult.outline || []
          }
        } catch (e) {
          // 尝试提取JSON数组
          const jsonMatch = cleanedResult.match(/\[\s*\{[\s\S]*\}\s*\]/)
          if (jsonMatch) {
            parsedResult = JSON.parse(jsonMatch[0])
          } else {
            throw new Error('无法解析AI返回的格式')
          }
        }
        
        // 转换并流式返回章节
        for (let i = 0; i < parsedResult.length; i++) {
          const item = parsedResult[i]
          const section: DocumentSection = {
            id: `section-${i + 1}`,
            title: item.title || `段落 ${i + 1}`,
            level: item.level || 1,
            summary: item.summary || '该段落的内容总结',
            mediaType: MediaType.TEXT,
            location: {
              textAnchor: item.anchor,
              charPosition: item.startChar
            } as LocationInfo
          }
          
          sections.push(section)
          
          yield { 
            type: 'section', 
            data: { 
              section, 
              index: i, 
              total: parsedResult.length 
            } 
          }
        }
      } catch (e) {
        console.error('后备处理失败:', e)
        throw new Error('AI返回的格式无效')
      }
    } else if (!isJsonArray && buffer.trim()) {
      // 处理最后可能残留的NDJSON内容
      try {
        const item = JSON.parse(buffer.trim())
        const section: DocumentSection = {
          id: `section-${sectionIndex + 1}`,
          title: item.title || `段落 ${sectionIndex + 1}`,
          level: item.level || 1,
          summary: item.summary || '该段落的内容总结',
          mediaType: MediaType.TEXT,
          location: {
            textAnchor: item.anchor,
            charPosition: item.startChar
          } as LocationInfo
        }
        
        sections.push(section)
        
        yield { 
          type: 'section', 
          data: { 
            section, 
            index: sectionIndex, 
            total: sections.length
          } 
        }
      } catch (e) {
        // 最后的buffer不是有效JSON
      }
    }

    yield { 
      type: 'complete', 
      data: { 
        message: '分析完成', 
        sectionsCount: sections.length,
        sections,
        documentSummary
      } 
    }

  } catch (error) {
    console.error('流式文档分析失败:', error)
    throw error
  }
}

// 保持向后兼容的非流式函数
export async function analyzeDocument(content: string, fileType: string): Promise<DocumentSection[]> {
  const sections: DocumentSection[] = []
  
  for await (const event of analyzeDocumentStream(content, fileType)) {
    if (event.type === 'section') {
      sections.push(event.data.section)
    } else if (event.type === 'complete') {
      return event.data.sections
    }
  }
  
  return sections
}

export function convertSectionsToMarkdown(sections: DocumentSection[], originalContent: string): string {
  // 只处理原始内容，为每个段落添加锚点标记
  let processedContent = originalContent
  
  // 为每个段落查找锚点并插入标记
  sections.forEach((section) => {
    const anchor = section.location.textAnchor
    if (anchor) {
      const anchorIndex = processedContent.indexOf(anchor)
      if (anchorIndex !== -1) {
        // 在锚点前插入span标记
        const beforeAnchor = processedContent.substring(0, anchorIndex)
        const afterAnchor = processedContent.substring(anchorIndex)
        processedContent = beforeAnchor + `<span id="${section.id}"></span>` + afterAnchor
      }
    }
  })
  
  return processedContent
}