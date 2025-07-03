/**
 * Diff 错误处理模块
 * 参考 Cline 的错误处理机制，提供友好的错误提示和建设性建议
 */

export interface DiffError {
  type: 'search_not_found' | 'format_error' | 'content_mismatch' | 'tool_parameter_missing' | 'xml_parse_error'
  severity: 'error' | 'warning' | 'info'
  message: string
  suggestions: string[]
  details?: {
    searchContent?: string
    expectedFormat?: string
    actualContent?: string
    line?: number
  }
}

/**
 * 格式化的错误响应消息
 */
export const formatDiffResponse = {
  searchNotFound: (searchContent: string, suggestions: string[] = []): DiffError => ({
    type: 'search_not_found',
    severity: 'error',
    message: `在笔记中找不到要替换的内容`,
    suggestions: [
      '检查搜索内容是否与笔记中的实际文本完全一致',
      '确认包含了正确的空格、换行符和缩进',
      '验证要替换的内容确实存在于当前笔记中',
      '尝试包含更多上下文以确保唯一匹配',
      ...suggestions
    ],
    details: {
      searchContent: searchContent.substring(0, 200) + (searchContent.length > 200 ? '...' : '')
    }
  }),

  formatError: (expectedFormat: string, actualContent: string): DiffError => ({
    type: 'format_error',
    severity: 'error',
    message: 'SEARCH/REPLACE 块格式不正确',
    suggestions: [
      '确保使用正确的 XML 格式：<replace_in_notes><diff>...</diff></replace_in_notes>',
      '检查 SEARCH/REPLACE 标记是否完整和正确',
      '验证是否包含了所有必需的标签',
      '确保没有额外的字符或格式错误'
    ],
    details: {
      expectedFormat,
      actualContent: actualContent.substring(0, 200) + (actualContent.length > 200 ? '...' : '')
    }
  }),

  contentMismatch: (searchContent: string, matchType: string, confidence: number): DiffError => ({
    type: 'content_mismatch',
    severity: 'warning',
    message: `使用 ${matchType} 匹配策略应用修改（置信度: ${(confidence * 100).toFixed(1)}%）`,
    suggestions: [
      matchType === 'line_trimmed' ? '检查空格和缩进是否完全一致' : '',
      matchType === 'block_anchor' ? '验证首末行是否正确匹配' : '',
      '考虑提供更精确的搜索内容',
      '检查是否有隐藏字符或特殊编码'
    ].filter(Boolean),
    details: {
      searchContent: searchContent.substring(0, 100) + (searchContent.length > 100 ? '...' : '')
    }
  }),

  toolParameterMissing: (parameterName: string): DiffError => ({
    type: 'tool_parameter_missing',
    severity: 'error',
    message: `缺少必需的工具参数 '${parameterName}'`,
    suggestions: [
      '确保提供了 diff 参数',
      '检查 XML 格式是否正确',
      '验证所有必需的标签都已包含',
      '重新生成完整的工具调用'
    ],
    details: {}
  }),

  xmlParseError: (error: string, content: string): DiffError => ({
    type: 'xml_parse_error',
    severity: 'error',
    message: 'XML 格式解析失败',
    suggestions: [
      '检查所有标签是否正确闭合',
      '确保没有未转义的特殊字符',
      '验证 XML 结构是否符合要求的格式',
      '使用正确的嵌套结构：<replace_in_notes><diff>...</diff></replace_in_notes>'
    ],
    details: {
      actualContent: content,
      expectedFormat: '<replace_in_notes><diff>------- SEARCH\n...\n=======\n...\n+++++++ REPLACE</diff></replace_in_notes>'
    }
  }),

  /**
   * 成功应用的提示消息
   */
  diffApplied: (matchType: string, confidence: number): string => {
    const messages = {
      exact: '✅ 精确匹配，修改已成功应用',
      line_trimmed: `🔄 使用行级匹配，修改已应用（置信度: ${(confidence * 100).toFixed(1)}%）`,
      block_anchor: `🔍 使用块锚点匹配，修改已应用（置信度: ${(confidence * 100).toFixed(1)}%）`
    }
    return messages[matchType as keyof typeof messages] || `✅ 修改已应用（${matchType}）`
  },

  /**
   * 批量操作的结果消息
   */
  batchResult: (applied: number, failed: number, total: number): string => {
    if (failed === 0) {
      return `✅ 成功应用了所有 ${total} 个修改`
    } else if (applied === 0) {
      return `❌ ${total} 个修改全部失败`
    } else {
      return `⚠️ ${total} 个修改中：${applied} 个成功，${failed} 个失败`
    }
  },

  /**
   * 工具调用被拒绝的消息
   */
  toolDenied: (): string => '用户拒绝了此修改操作',

  /**
   * 重试相关的消息
   */
  retryInitiated: (retryCount: number): string => `开始第 ${retryCount} 次重试...`,
  
  retrySucceeded: (retryCount: number): string => `✅ 第 ${retryCount} 次重试成功`,
  
  retryFailed: (retryCount: number, maxRetries: number): string => 
    `❌ 第 ${retryCount} 次重试失败${retryCount >= maxRetries ? '，已达到最大重试次数' : ''}`,
  
  maxRetriesReached: (maxRetries: number): string => 
    `⚠️ 已达到最大重试次数 ${maxRetries}，需要用户介入`,
  
  autoRetryDisabled: (): string => '自动重试已禁用，请手动重试或修改',

  /**
   * 生成建设性的错误恢复建议
   */
  getRecoverySuggestions: (error: DiffError): string[] => {
    const commonSuggestions = [
      '可以要求 AI 重新生成更精确的修改建议',
      '尝试手动修改笔记内容',
      '检查笔记是否已被其他操作修改'
    ]

    switch (error.type) {
      case 'search_not_found':
        return [
          '点击"重新生成"按钮触发自动重试',
          '要求 AI 查看当前笔记内容并重新生成 diff',
          '手动复制要修改的内容段落给 AI 参考',
          '使用更具体的关键词重新描述修改需求',
          ...commonSuggestions
        ]
      
      case 'format_error':
      case 'xml_parse_error':
        return [
          '系统会自动重试并修正格式错误',
          '要求 AI 使用正确的 XML 格式重新生成',
          '检查是否有特殊字符需要转义',
          '简化修改内容，避免复杂的格式',
          ...commonSuggestions
        ]
      
      case 'content_mismatch':
        return [
          '接受当前的模糊匹配结果（如果合理）',
          '点击"重新生成"获得更精确的修改',
          '要求 AI 提供更精确的搜索内容',
          '检查文档是否已被修改',
          ...commonSuggestions
        ]
      
      default:
        return commonSuggestions
    }
  }
}

/**
 * 解析工具调用错误并返回友好的错误信息
 */
export function parseDiffError(error: any, context?: any): DiffError {
  // 检查是否是搜索内容未找到
  if (error.message?.includes('找不到') || error.message?.includes('not found')) {
    return formatDiffResponse.searchNotFound(context?.searchContent || '', context?.suggestions || [])
  }

  // 检查是否是格式错误
  if (error.message?.includes('格式') || error.message?.includes('format')) {
    return formatDiffResponse.formatError(
      context?.expectedFormat || 'SEARCH/REPLACE 块格式',
      context?.actualContent || error.message
    )
  }

  // 检查是否是 XML 解析错误
  if (error.message?.includes('XML') || error.message?.includes('xml')) {
    return formatDiffResponse.xmlParseError(error.message, context?.content || '')
  }

  // 检查是否是参数缺失
  if (error.message?.includes('参数') || error.message?.includes('parameter')) {
    return formatDiffResponse.toolParameterMissing(context?.parameterName || 'diff')
  }

  // 默认错误处理
  return {
    type: 'content_mismatch',
    severity: 'error',
    message: error.message || '未知错误',
    suggestions: formatDiffResponse.getRecoverySuggestions({
      type: 'content_mismatch',
      severity: 'error',
      message: '',
      suggestions: []
    }),
    details: context
  }
}

/**
 * 生成用户友好的错误提示文本
 */
export function generateUserFriendlyError(error: DiffError): string {
  let message = `**${error.severity === 'error' ? '❌' : error.severity === 'warning' ? '⚠️' : 'ℹ️'} ${error.message}**\n\n`
  
  if (error.suggestions.length > 0) {
    message += '**建议解决方案：**\n'
    error.suggestions.forEach((suggestion, index) => {
      message += `${index + 1}. ${suggestion}\n`
    })
    message += '\n'
  }

  if (error.details?.searchContent) {
    message += '**查找的内容：**\n```\n' + error.details.searchContent + '\n```\n\n'
  }

  const recoverySuggestions = formatDiffResponse.getRecoverySuggestions(error)
  if (recoverySuggestions.length > 0) {
    message += '**下一步操作：**\n'
    recoverySuggestions.forEach((suggestion, index) => {
      message += `• ${suggestion}\n`
    })
  }

  return message
}