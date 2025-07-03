import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getAgentSystemPrompt } from '@/lib/prompts'

// 初始化 OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
})

// 优化的流式 Diff 检测器类
class StreamingDiffDetector {
  private buffer: string = ''
  private detectedDiffs: Set<string> = new Set()
  private lastCheckPosition: number = 0
  
  processChunk(chunk: string, fullContent: string, structuredNotes: string): any[] {
    this.buffer = fullContent
    const newDiffs: any[] = []
    
    // 检查整个缓冲区，相信模型的非贪婪匹配能正确分离多个工具调用
    const searchArea = this.buffer
    
    // 查找完整的工具调用
    const toolCallRegex = /<replace_in_notes>[\s\S]*?<\/replace_in_notes>/g
    let match
    
    while ((match = toolCallRegex.exec(searchArea)) !== null) {
      const toolCall = match[0]
      const toolCallHash = this.hashString(toolCall)
      
      // 如果这是一个新的完整工具调用
      if (!this.detectedDiffs.has(toolCallHash)) {
        this.detectedDiffs.add(toolCallHash)
        
        const diff = this.extractDiffFromToolCall(toolCall)
        if (diff) {
          console.log(`🎯 [StreamingDiff] 流式检测到新的 diff #${this.detectedDiffs.size} (位置: ${match.index})`)
          newDiffs.push(diff)
        }
      }
    }
    
    // 更新检查位置
    this.lastCheckPosition = this.buffer.length
    
    return newDiffs
  }
  
  private extractDiffFromToolCall(toolCall: string): any | null {
    // 提取 diff 内容（兼容有无 <diff> 标签的情况）
    let diffContent = ''
    const diffMatch = toolCall.match(/<diff>([\s\S]*?)<\/diff>/)
    if (diffMatch) {
      diffContent = diffMatch[1].trim()
    } else {
      // 如果没有 <diff> 标签，使用整个工具调用内容
      const contentMatch = toolCall.match(/<replace_in_notes>([\s\S]*?)<\/replace_in_notes>/)
      if (contentMatch) {
        diffContent = contentMatch[1].trim()
      }
    }
    
    if (!diffContent) return null
    
    // 验证是否包含 SEARCH/REPLACE 格式
    if (!/---+\s*SEARCH/i.test(diffContent) || !/\++\s*REPLACE/i.test(diffContent)) {
      return null
    }
    
    return {
      id: `diff_${Date.now()}_${this.detectedDiffs.size}_${Math.random().toString(36).substr(2, 6)}`,
      type: 'search_replace',
      tool: 'replace_in_notes',
      diff: diffContent,
      status: 'pending',
      metadata: {
        generatedAt: new Date().toISOString(),
        streamIndex: this.detectedDiffs.size
      }
    }
  }
  
  getFinalDiffs(fullContent: string, structuredNotes: string): any[] {
    // 最终检查整个内容，确保没有遗漏
    const finalRegex = /<replace_in_notes>[\s\S]*?<\/replace_in_notes>/g
    const newDiffs: any[] = []
    let match
    
    while ((match = finalRegex.exec(fullContent)) !== null) {
      const toolCall = match[0]
      const toolCallHash = this.hashString(toolCall)
      
      if (!this.detectedDiffs.has(toolCallHash)) {
        this.detectedDiffs.add(toolCallHash)
        const diff = this.extractDiffFromToolCall(toolCall)
        if (diff) {
          console.log(`🔍 [StreamingDiff] 最终检查发现遗漏的 diff`)
          newDiffs.push(diff)
        }
      }
    }
    
    return newDiffs
  }
  
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString()
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, context, history, mode, structuredNotes, retryInfo } = await request.json()

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

    // 使用集中管理的系统提示
    const agentSystemPrompt = getAgentSystemPrompt(structuredNotes, context)

    // 构建消息历史
    const messages: Array<{ role: 'system' | 'user' | 'assistant', content: string }> = [
      {
        role: 'system',
        content: agentSystemPrompt
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

    // 处理重试信息
    let finalMessage = message
    if (retryInfo) {
      console.log('🔄 处理重试请求:', retryInfo)
      // 生成包含错误反馈的提示词
      const retryPrompt = generateRetryPrompt(retryInfo.failedDiff, structuredNotes, retryInfo.error)
      finalMessage = retryPrompt
    }

    // 添加当前用户消息
    messages.push({
      role: 'user',
      content: finalMessage
    })

    // 创建流式响应，增加超时和错误处理
    console.log(`🤖 [Agent] 使用模型: ${process.env.OPENAI_MODEL}, 消息数: ${messages.length}`)
    
    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL!,
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 2000,
    }).catch(error => {
      console.error('🚨 [Agent] OpenAI API 调用失败:', error)
      throw new Error(`OpenAI API 错误: ${error.message}`)
    })

    // 创建可读流
    const encoder = new TextEncoder()
    const readableStream = new ReadableStream({
      async start(controller) {
        let fullContent = ''
        let streamAborted = false
        let controllerClosed = false // 新增：跟踪 controller 状态
        let lastDataTime = Date.now() // 记录最后收到数据的时间
        
        // 安全的 controller 操作函数
        const safeEnqueue = (data: Uint8Array) => {
          if (!controllerClosed && !streamAborted) {
            try {
              controller.enqueue(data)
            } catch (e) {
              console.warn('Controller enqueue 失败:', e)
              controllerClosed = true
            }
          }
        }
        
        const safeClose = () => {
          if (!controllerClosed) {
            try {
              controller.close()
              controllerClosed = true
            } catch (e) {
              console.warn('Controller close 失败:', e)
              controllerClosed = true
            }
          }
        }
        
        // 优化的超时检查 - 减少检查频率和操作复杂度
        const checkStreamTimeout = () => {
          if (streamAborted || controllerClosed) return
          
          const now = Date.now()
          const timeSinceLastData = now - lastDataTime
          
          if (timeSinceLastData > 15000) { // 延长超时时间到15秒
            console.log(`⚠️ [Agent Debug] 流式数据超时(${timeSinceLastData}ms无数据)，强制结束`)
            streamAborted = true
            
            const timeoutData = `data: ${JSON.stringify({ 
              type: 'error', 
              error: '连接超时，正在自动重试...'
            })}\n\n`
            safeEnqueue(encoder.encode(timeoutData))
            safeClose()
            return
          }
          
          // 如果没有超时且流没有中止，继续检查（减少频率）
          if (!streamAborted && !controllerClosed) {
            setTimeout(checkStreamTimeout, 5000) // 每5秒检查一次，减少频率
          }
        }
        
        // 开始超时检查
        setTimeout(checkStreamTimeout, 5000) // 延迟首次检查
        
        // 创建流式 diff 检测器
        const streamingDiffDetector = new StreamingDiffDetector()
        
        try {
          console.log('🤖 [Agent Debug] 开始流式处理 AI 回复...')
          
          for await (const chunk of stream) {
            if (streamAborted || controllerClosed) {
              console.log('🚫 [Agent Debug] 流已被中止，停止处理')
              break
            }
            
            try {
              const content = chunk.choices[0]?.delta?.content
              if (content) {
                fullContent += content
                lastDataTime = Date.now() // 更新最后收到数据的时间
                
                // 流式返回内容
                const data = `data: ${JSON.stringify({ 
                  type: 'content', 
                  content 
                })}\n\n`
                safeEnqueue(encoder.encode(data))
                
                // 在 Agent 模式下，每个 chunk 都检测 diff（提高检测精度）
                if (mode === 'agent' && structuredNotes) {
                  const newDiffs = streamingDiffDetector.processChunk(content, fullContent, structuredNotes)
                  
                  // 发送新检测到的 diff
                  for (const diff of newDiffs) {
                    console.log('📤 [Agent Debug] 流式发送 diff:', diff.id)
                    const diffData = `data: ${JSON.stringify({ 
                      type: 'diff', 
                      diff 
                    })}\n\n`
                    safeEnqueue(encoder.encode(diffData))
                  }
                  
                  // 每次检测记录
                  if (newDiffs.length > 0) {
                    console.log(`🎆 [Streaming Diff] 在流式过程中检测到 ${newDiffs.length} 个 diff`)
                  }
                }
              }
            } catch (chunkError) {
              console.warn('🔶 [Agent Debug] 处理单个 chunk 时出错:', chunkError)
              // 继续处理下一个 chunk，不中断整个流
            }
          }
          
          console.log('✅ [Agent Debug] AI回复阶段完成')
          lastDataTime = Date.now() // 更新时间
          
          if (streamAborted || controllerClosed) {
            console.log('🚫 [Agent Debug] 流已中止，跳过后续处理')
            return
          }
          
          console.log('🤖 [Agent Debug] AI 完整回复内容:')
          console.log('='.repeat(80))
          console.log(fullContent)  // 完整输出，不截断
          console.log('='.repeat(80))
          console.log(`📊 [Agent Debug] 内容统计: 总长度=${fullContent.length}字符`)
          
          // 流式处理已经发送了所有 diff，这里只需要检查是否有遗漏的
          if (mode === 'agent' && structuredNotes && !streamAborted && !controllerClosed) {
            const finalDiffs = streamingDiffDetector.getFinalDiffs(fullContent, structuredNotes)
            if (finalDiffs.length > 0) {
              console.log(`🔍 [Agent Debug] 发现 ${finalDiffs.length} 个遗漏的 diff`)
              for (const diff of finalDiffs) {
                console.log('📤 [Agent Debug] 补充发送 diff:', diff.id)
                const diffData = `data: ${JSON.stringify({ 
                  type: 'diff', 
                  diff 
                })}\n\n`
                safeEnqueue(encoder.encode(diffData))
              }
            }
          }
          
          // 发送完成标志
          if (!streamAborted && !controllerClosed) {
            lastDataTime = Date.now() // 更新时间
            const endData = `data: ${JSON.stringify({ 
              type: 'complete',
              message: mode === 'agent' ? '已生成回答和笔记建议' : '回答完成'
            })}\n\n`
            safeEnqueue(encoder.encode(endData))
            
            console.log('✅ [Agent Debug] 所有处理完成')
            console.log('🏁 [Agent Debug] ===== 流式输出结束标记 =====')
            safeClose()
          }
        } catch (error) {
          console.error('🔥 [Agent Debug] 流式处理出错:', error)
          console.error('🔥 [Agent Debug] 错误堆栈:', error instanceof Error ? error.stack : String(error))
          console.log('⚠️ [Agent Debug] 当前处理状态:', {
            streamAborted,
            controllerClosed,
            fullContentLength: fullContent.length,
            lastDataTime: new Date(lastDataTime).toISOString()
          })
          streamAborted = true
          
          // 检查错误类型，提供更友好的错误信息
          let errorMessage = 'Stream processing failed'
          if (error instanceof Error) {
            if (error.message.includes('socket') || error.message.includes('network') || error.message.includes('terminated')) {
              errorMessage = '网络连接中断，请检查网络或稍后重试'
            } else if (error.message.includes('timeout')) {
              errorMessage = '请求超时，请稍后重试'
            } else if (error.message.includes('aborted')) {
              errorMessage = '请求被取消'
              console.log('🛑 [Agent Debug] 检测到取消操作 - 可能是用户主动停止')
            }
          }
          
          if (!controllerClosed) {
            const errorData = `data: ${JSON.stringify({ 
              type: 'error', 
              error: errorMessage
            })}\n\n`
            safeEnqueue(encoder.encode(errorData))
            console.log('📤 [Agent Debug] 发送错误信息到客户端:', errorMessage)
            safeClose()
          }
          console.log('🏁 [Agent Debug] ===== 流式输出异常结束 =====')
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
    console.error('Agent chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 解析多个 SEARCH/REPLACE 块的函数
function analyzeForMultipleDiffSuggestions(aiResponse: string, structuredNotes: string) {
  console.log('🔎 [Multi-Diff Analysis] 开始分析多段 diff 建议...')
  console.log('🔎 [Multi-Diff Analysis] AI 响应内容（完整）:')
  console.log('─'.repeat(50))
  console.log(aiResponse)  // 完整输出，不截断
  console.log('─'.repeat(50))
  console.log(`📊 [Multi-Diff Analysis] 内容统计: 总长度=${aiResponse.length}字符`)
  
  const diffSuggestions: any[] = []
  
  // 方法 1: 查找所有 replace_in_notes 工具调用
  const replaceToolMatches = aiResponse.matchAll(/<replace_in_notes>\s*(?:<diff>)?([\s\S]*?)(?:<\/diff>\s*)?<\/replace_in_notes>/g)
  
  let toolCallCount = 0
  for (const match of replaceToolMatches) {
    toolCallCount++
    console.log(`🔎 [Multi-Diff Analysis] 找到第 ${toolCallCount} 个 replace_in_notes 工具调用`)
    
    const diffContent = match[1].trim()
    const suggestion = processSingleDiffContent(diffContent, structuredNotes, toolCallCount)
    if (suggestion) {
      diffSuggestions.push(suggestion)
    }
  }
  
  // 方法 2: 如果没有找到工具调用，尝试直接查找 SEARCH/REPLACE 块
  if (toolCallCount === 0) {
    console.log('🔎 [Multi-Diff Analysis] 未找到工具调用，直接查找 SEARCH/REPLACE 块...')
    
    // 查找所有 SEARCH/REPLACE 块对
    const searchReplaceBlocks = extractSearchReplaceBlocks(aiResponse)
    
    for (let i = 0; i < searchReplaceBlocks.length; i++) {
      console.log(`🔎 [Multi-Diff Analysis] 处理第 ${i + 1} 个 SEARCH/REPLACE 块`)
      
      const suggestion = processSingleDiffContent(searchReplaceBlocks[i], structuredNotes, i + 1)
      if (suggestion) {
        diffSuggestions.push(suggestion)
      }
    }
  }
  
  console.log(`🔎 [Multi-Diff Analysis] 总共生成了 ${diffSuggestions.length} 个 diff 建议`)
  return diffSuggestions
}

// 提取所有 SEARCH/REPLACE 块
function extractSearchReplaceBlocks(content: string): string[] {
  const blocks: string[] = []
  
  // 查找所有 SEARCH 块的开始位置（更宽松的匹配）
  const searchStartPattern = /---+\s*SEARCH/gm
  const replaceEndPattern = /\++\s*REPLACE/gm
  
  let searchMatch
  const searchPositions: number[] = []
  
  // 找出所有 SEARCH 位置
  while ((searchMatch = searchStartPattern.exec(content)) !== null) {
    searchPositions.push(searchMatch.index)
  }
  
  console.log(`🔎 [Block Extract] 找到 ${searchPositions.length} 个 SEARCH 块`)
  
  // 为每个 SEARCH 找到对应的 REPLACE 结尾
  for (let i = 0; i < searchPositions.length; i++) {
    const searchStart = searchPositions[i]
    const nextSearchStart = searchPositions[i + 1] || content.length
    
    // 在当前 SEARCH 和下一个 SEARCH 之间查找 REPLACE 结尾
    const sectionContent = content.slice(searchStart, nextSearchStart)
    const replaceEndMatch = sectionContent.match(/\++\s*REPLACE/m)
    
    if (replaceEndMatch && replaceEndMatch.index !== undefined) {
      const blockEnd = searchStart + replaceEndMatch.index + replaceEndMatch[0].length
      const fullBlock = content.slice(searchStart, blockEnd)
      blocks.push(fullBlock)
      console.log(`🔎 [Block Extract] 提取块 ${i + 1}:`)
      console.log('─'.repeat(30))
      console.log(fullBlock)  // 完整输出每个块
      console.log('─'.repeat(30))
    } else {
      console.log(`🔎 [Block Extract] 块 ${i + 1} 缺少 REPLACE 结尾`)
    }
  }
  
  return blocks
}

// 生成错误反馈提示词
function generateRetryPrompt(failedDiff: any, currentNotes: string, error: any): string {
  const errorMessage = error?.message || '未知错误'
  const searchContent = failedDiff?.diff ? extractSearchContent(failedDiff.diff) : ''
  
  return `
上次修改失败了，需要你重新生成一个更精确的修改。

**失败原因**：${errorMessage}

**失败的搜索内容**：
\`\`\`
${searchContent.substring(0, 200)}${searchContent.length > 200 ? '...' : ''}
\`\`\`

**当前笔记的完整内容**：
\`\`\`
${currentNotes}
\`\`\`

**要求**：
1. 仔细检查当前笔记内容，确保你要查找的文本确实存在
2. 使用完全匹配的文本（包括空格、换行、标点符号）作为 SEARCH 内容
3. 确保 SEARCH 内容是连续的文本片段，不要省略中间部分
4. 如果原来的修改思路不可行，请提供新的解决方案

请重新生成正确的 replace_in_notes 工具调用。
`
}

// 从 diff 内容中提取 SEARCH 内容
function extractSearchContent(diffContent: string): string {
  const searchMatch = diffContent.match(/---+\s*SEARCH\s*([\s\S]*?)\s*=+/i)
  return searchMatch ? searchMatch[1].trim() : ''
}

// 处理单个 diff 内容
function processSingleDiffContent(diffContent: string, structuredNotes: string, index: number): any | null {
  console.log(`🔎 [Process Single] 处理第 ${index} 个 diff 内容...`)
  
  // 验证是否包含 SEARCH/REPLACE 格式（更宽松的匹配）
  const hasSearchReplace = /---+\s*SEARCH/i.test(diffContent) && /\++\s*REPLACE/i.test(diffContent)
  console.log(`🔎 [Process Single] diff 内容包含 SEARCH/REPLACE 格式:`, hasSearchReplace)
  
  if (!hasSearchReplace) {
    console.log(`🔎 [Process Single] 第 ${index} 个 diff 格式不正确，跳过`)
    return null
  }
  
  // 基本的重复检查
  const repetitivenesCheck = analyzeRepetitiveness(diffContent, structuredNotes)
  if (repetitivenesCheck.similarity > 0.8) {
    console.log(`🔎 [Process Single] 第 ${index} 个 diff 内容重复度过高，跳过`)
    return null
  }
  
  // 生成 diff 建议
  const diffSuggestion = {
    id: `diff_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 6)}`,
    type: 'search_replace',
    tool: 'replace_in_notes', 
    diff: diffContent,
    status: 'pending',
    metadata: {
      generatedAt: new Date().toISOString(),
      blockIndex: index
    }
  }
  
  console.log(`🔎 [Process Single] 成功生成第 ${index} 个 diff 建议:`, diffSuggestion.id)
  return diffSuggestion
}

// 简化的分析函数：检查AI是否在响应中使用了replace_in_notes工具（保持向后兼容）
function analyzeForDiffSuggestion(aiResponse: string, structuredNotes: string) {
  const suggestions = analyzeForMultipleDiffSuggestions(aiResponse, structuredNotes)
  return suggestions && suggestions.length > 0 ? suggestions[0] : null
}

// 改进的重复性检测
function analyzeRepetitiveness(newContent: string, existingNotes: string) {
  if (!existingNotes || existingNotes.length === 0) {
    return { similarity: 0, reasons: [] }
  }

  // 提取关键短语（2-4个词的组合）
  const extractKeyPhrases = (text: string) => {
    const words = text.toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1)
    
    const phrases = []
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(words.slice(i, i + 2).join(' ')) // 2词组合
      if (i < words.length - 2) {
        phrases.push(words.slice(i, i + 3).join(' ')) // 3词组合
      }
    }
    return new Set(phrases)
  }

  const newPhrases = extractKeyPhrases(newContent)
  const existingPhrases = extractKeyPhrases(existingNotes)
  
  // 计算短语重叠度
  const overlap = new Set([...newPhrases].filter(p => existingPhrases.has(p)))
  const similarity = overlap.size / Math.max(newPhrases.size, 1)
  
  return {
    similarity,
    reasons: similarity > 0.6 ? ['高度相似的关键短语'] : []
  }
}

// 计算文本相似度（简化版）
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().match(/\w+/g) || [])
  const words2 = new Set(text2.toLowerCase().match(/\w+/g) || [])
  
  const intersection = new Set([...words1].filter(word => words2.has(word)))
  const union = new Set([...words1, ...words2])
  
  return intersection.size / union.size
}

