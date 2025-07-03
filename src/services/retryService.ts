/**
 * 重试服务 - 处理 diff 失败后的自动重试机制
 * 实现 Cline 风格的错误反馈循环
 */

import { DiffAction } from '@/components/DiffCard'
import { DiffError } from '@/utils/diffErrorHandler'

export interface RetryRequest {
  failedDiff: DiffAction
  error: DiffError
  currentNotes: string
  retryReason?: string
}

export interface RetryConfig {
  maxRetries: number
  retryDelay: number
  enableAutoRetry: boolean
}

export class RetryService {
  private config: RetryConfig
  private retryHistory: Map<string, number> = new Map()

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      maxRetries: 2, // 最多自动重试2次
      retryDelay: 1000, // 重试延迟1秒
      enableAutoRetry: true,
      ...config
    }
  }

  /**
   * 检查是否应该自动重试
   */
  shouldAutoRetry(diffId: string, error: DiffError): boolean {
    if (!this.config.enableAutoRetry) {
      return false
    }

    const retryCount = this.retryHistory.get(diffId) || 0
    
    // 超过最大重试次数
    if (retryCount >= this.config.maxRetries) {
      console.log(`⚠️ diff ${diffId} 已达到最大重试次数 ${this.config.maxRetries}`)
      return false
    }

    // 只对特定类型的错误进行自动重试
    const autoRetryableErrors = ['search_not_found', 'content_mismatch']
    if (!autoRetryableErrors.includes(error.type)) {
      console.log(`⚠️ 错误类型 ${error.type} 不支持自动重试`)
      return false
    }

    // 严重错误不自动重试
    if (error.severity === 'error') {
      console.log(`⚠️ 严重错误不自动重试: ${error.message}`)
      return false
    }

    return true
  }

  /**
   * 执行重试请求
   */
  async executeRetry(retryRequest: RetryRequest): Promise<{
    success: boolean
    newDiffs?: DiffAction[]
    error?: string
  }> {
    const { failedDiff, error, currentNotes, retryReason } = retryRequest
    
    // 更新重试计数
    const currentRetryCount = this.retryHistory.get(failedDiff.id) || 0
    this.retryHistory.set(failedDiff.id, currentRetryCount + 1)

    console.log(`🔄 执行重试 #${currentRetryCount + 1} for diff ${failedDiff.id}`)

    try {
      // 等待重试延迟
      if (this.config.retryDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
      }

      // 调用 agent-chat-stream API 进行重试
      const response = await fetch('/api/agent-chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: '请重新生成修改', // 这会被 retryInfo 覆盖
          structuredNotes: currentNotes,
          retryInfo: {
            failedDiff,
            error,
            retryReason: retryReason || `第${currentRetryCount + 1}次重试`
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 处理流式响应
      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      const decoder = new TextDecoder()
      let fullResponse = ''
      let detectedDiffs: DiffAction[] = []

      try {
        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          const chunk = decoder.decode(value, { stream: true })
          fullResponse += chunk

          // 检查是否有新的 diff 建议
          const chunkData = this.extractDiffsFromChunk(chunk)
          if (chunkData.length > 0) {
            detectedDiffs.push(...chunkData)
          }
        }
      } finally {
        reader.releaseLock()
      }

      if (detectedDiffs.length > 0) {
        console.log(`✅ 重试成功，生成了 ${detectedDiffs.length} 个新的 diff`)
        return {
          success: true,
          newDiffs: detectedDiffs
        }
      } else {
        console.log(`⚠️ 重试完成但未生成新的 diff`)
        return {
          success: false,
          error: '重试完成但未生成有效的修改建议'
        }
      }

    } catch (error) {
      console.error(`❌ 重试失败:`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '重试过程中发生未知错误'
      }
    }
  }

  /**
   * 从响应流中提取 diff 建议
   */
  private extractDiffsFromChunk(chunk: string): DiffAction[] {
    const diffs: DiffAction[] = []
    
    try {
      // 查找 SSE 数据行
      const lines = chunk.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6) // 移除 'data: ' 前缀
          if (data.trim() === '[DONE]') continue
          
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'diff_suggestion' && parsed.suggestion) {
              diffs.push(parsed.suggestion)
            }
          } catch (parseError) {
            // 忽略解析错误，继续处理其他行
          }
        }
      }
    } catch (error) {
      console.warn('提取 diff 时出错:', error)
    }

    return diffs
  }

  /**
   * 清理重试历史
   */
  clearRetryHistory(diffId?: string) {
    if (diffId) {
      this.retryHistory.delete(diffId)
    } else {
      this.retryHistory.clear()
    }
  }

  /**
   * 获取重试统计
   */
  getRetryStats() {
    const stats = {
      totalRetries: 0,
      activeDiffs: this.retryHistory.size,
      retryHistory: Array.from(this.retryHistory.entries()).map(([diffId, count]) => ({
        diffId: diffId.slice(-8), // 只显示最后8位
        retryCount: count
      }))
    }

    this.retryHistory.forEach(count => {
      stats.totalRetries += count
    })

    return stats
  }
}

// 全局重试服务实例
export const retryService = new RetryService({
  maxRetries: 2,
  retryDelay: 1000,
  enableAutoRetry: true
})

/**
 * 重试错误类型判断
 */
export const RetryErrorTypes = {
  isRetryable: (error: DiffError): boolean => {
    return ['search_not_found', 'content_mismatch'].includes(error.type) && 
           error.severity !== 'error'
  },
  
  isAutoRetryable: (error: DiffError): boolean => {
    return error.type === 'search_not_found' && error.severity === 'warning'
  },
  
  needsUserIntervention: (error: DiffError): boolean => {
    return error.severity === 'error' || 
           ['format_error', 'xml_parse_error', 'tool_parameter_missing'].includes(error.type)
  }
}