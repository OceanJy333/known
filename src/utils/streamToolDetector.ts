/**
 * 增强的流式工具检测器
 * 检测 replace_in_notes 工具调用并支持多段处理
 */

export class StreamToolDetector {
  private buffer: string = ''
  private processedToolCalls: Set<string> = new Set()

  /**
   * 处理流式内容块
   */
  processChunk(chunk: string): string {
    this.buffer += chunk
    
    // 改进的处理：保留完整的工具调用，移除不完整的
    let cleanContent = this.buffer
    
    // 1. 检测并移除不完整的工具调用
    const incompleteMatches = cleanContent.match(/<replace_in_notes>(?![\s\S]*?<\/replace_in_notes>)[\s\S]*$/g)
    if (incompleteMatches) {
      // 找到最后一个不完整的工具调用开始位置
      const lastIncompleteStart = cleanContent.lastIndexOf('<replace_in_notes>')
      const hasCompleteAfter = cleanContent.slice(lastIncompleteStart).includes('</replace_in_notes>')
      
      if (!hasCompleteAfter) {
        // 移除不完整的工具调用部分
        cleanContent = cleanContent.slice(0, lastIncompleteStart)
      }
    }
    
    // 2. 检测完整的工具调用并处理
    const completeToolRegex = /<replace_in_notes>[\s\S]*?<\/replace_in_notes>/g
    let match
    let processedContent = cleanContent
    
    // 找到所有完整的工具调用
    while ((match = completeToolRegex.exec(cleanContent)) !== null) {
      const toolCall = match[0]
      const toolCallHash = this.hashString(toolCall)
      
      if (!this.processedToolCalls.has(toolCallHash)) {
        this.processedToolCalls.add(toolCallHash)
        console.log('🔧 [StreamToolDetector] 检测到新的完整工具调用')
      }
    }
    
    // 3. 移除所有完整的工具调用，让 diff 卡片来显示
    processedContent = processedContent.replace(completeToolRegex, '')
    
    return processedContent
  }

  /**
   * 生成字符串哈希值
   */
  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }
    return hash.toString()
  }
  
  /**
   * 重置检测器
   */
  reset() {
    this.buffer = ''
    this.processedToolCalls.clear()
  }
  
  /**
   * 处理连接中断的情况
   */
  handleConnectionError(): string {
    // 如果缓冲区中有未完成的工具调用，移除它们
    let cleanContent = this.buffer
    
    const incompleteMatches = cleanContent.match(/<replace_in_notes>(?![\s\S]*?<\/replace_in_notes>)[\s\S]*$/g)
    if (incompleteMatches) {
      const lastIncompleteStart = cleanContent.lastIndexOf('<replace_in_notes>')
      const hasCompleteAfter = cleanContent.slice(lastIncompleteStart).includes('</replace_in_notes>')
      
      if (!hasCompleteAfter) {
        cleanContent = cleanContent.slice(0, lastIncompleteStart)
      }
    }
    
    // 移除所有完整的工具调用
    cleanContent = cleanContent.replace(/<replace_in_notes>[\s\S]*?<\/replace_in_notes>/g, '')
    
    return cleanContent
  }
  
  /**
   * 获取完整内容
   */
  getFullContent(): string {
    return this.buffer
  }
  
  /**
   * 检测是否正在生成工具调用
   */
  isGeneratingTool(): boolean {
    // 检查是否有未完成的工具调用
    const hasIncomplete = this.buffer.includes('<replace_in_notes>') && 
                          !this.buffer.slice(this.buffer.lastIndexOf('<replace_in_notes>')).includes('</replace_in_notes>')
    
    return hasIncomplete
  }
  
  /**
   * 获取已处理的工具调用数量
   */
  getProcessedToolCallCount(): number {
    return this.processedToolCalls.size
  }
}