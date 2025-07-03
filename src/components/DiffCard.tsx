'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { formatDiffResponse, DiffError } from '@/utils/diffErrorHandler'

export interface DiffAction {
  id: string
  type: 'insert' | 'delete' | 'replace' | 'search_replace'
  position?: {
    line?: number
    anchor?: string  // 钩子句子
    before?: string  // 要删除的内容
  }
  content?: {
    old?: string     // 旧内容（删除或替换时）
    new: string      // 新内容
  }
  // 新格式字段
  tool?: string        // 'replace_in_notes'
  diff?: string        // SEARCH/REPLACE 格式的diff内容
  metadata?: {
    generatedAt?: string
    matchType?: 'exact' | 'line_trimmed' | 'block_anchor' | 'fuzzy'
    confidence?: number
    error?: DiffError
    retryCount?: number  // 重试次数
    parentId?: string    // 原始 diff ID（用于重试）
    retryReason?: string // 重试原因
  }
  status: 'pending' | 'accepted' | 'rejected' | 'failed' | 'retrying'
}

interface DiffCardProps {
  diff: DiffAction
  onAccept: (diffId: string) => void
  onReject: (diffId: string) => void
  onRetry?: (diffId: string) => void  // 新增重试回调
  className?: string
}

export default function DiffCard({ diff, onAccept, onReject, onRetry, className = '' }: DiffCardProps) {
  // 笔记修改类型默认展开，其他类型默认收起
  const [isExpanded, setIsExpanded] = useState(diff.type === 'search_replace')

  // 检查是否是新格式的 search_replace diff
  const isSearchReplace = diff.type === 'search_replace' && diff.diff

  // 解析 SEARCH/REPLACE 格式的 diff
  const parseDiff = () => {
    if (!isSearchReplace || !diff.diff) {
      return { searchContent: '', replaceContent: '' }
    }

    const diffContent = diff.diff
    const searchMatch = diffContent.match(/---+\s*SEARCH\s*([\s\S]*?)\s*=+/i)
    const replaceMatch = diffContent.match(/=+\s*([\s\S]*?)\s*\++\s*REPLACE/i)

    return {
      searchContent: searchMatch ? searchMatch[1].trim() : '',
      replaceContent: replaceMatch ? replaceMatch[1].trim() : ''
    }
  }

  const { searchContent, replaceContent } = parseDiff()

  // 获取 diff 类型的图标和颜色
  const getDiffIcon = () => {
    switch (diff.type) {
      case 'insert':
        return { icon: 'fa-plus', color: 'text-green-600 dark:text-green-400' }
      case 'delete':
        return { icon: 'fa-minus', color: 'text-red-600 dark:text-red-400' }
      case 'replace':
        return { icon: 'fa-edit', color: 'text-blue-600 dark:text-blue-400' }
      case 'search_replace':
        return { icon: 'fa-sync-alt', color: 'text-blue-600 dark:text-blue-400' }
      default:
        return { icon: 'fa-code', color: 'text-gray-600 dark:text-gray-400' }
    }
  }

  const { icon, color } = getDiffIcon()

  // 获取状态样式
  const getStatusStyle = () => {
    switch (diff.status) {
      case 'failed':
        return 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
      case 'accepted':
        return 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
      case 'rejected':
        return 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800/50'
      case 'retrying':
        return 'border-yellow-200 dark:border-yellow-700 bg-yellow-50 dark:bg-yellow-900/10'
      default:
        return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }
  }

  // 处理接受操作
  const handleAccept = () => {
    onAccept(diff.id)
  }

  // 处理拒绝操作
  const handleReject = () => {
    onReject(diff.id)
  }

  // 格式化内容显示
  const formatContent = (content: string, maxLength = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className={`diff-card ${getStatusStyle()} ${className}`}>
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className={`flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700`}>
            <i className={`fas ${icon} text-xs ${color}`} />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {diff.type === 'insert' && '新增内容'}
            {diff.type === 'delete' && '删除内容'}
            {diff.type === 'replace' && '替换内容'}
            {diff.type === 'search_replace' && '笔记修改'}
          </span>
          {diff.position?.anchor && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
              位置: {formatContent(diff.position.anchor, 30)}
            </span>
          )}
          {isSearchReplace && (
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded">
              AI 建议
            </span>
          )}
          {diff.metadata?.matchType && diff.status !== 'failed' && diff.status !== 'retrying' && (
            <span className={`text-xs px-2 py-0.5 rounded ${
              diff.metadata.matchType === 'exact' 
                ? 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900' 
                : diff.metadata.matchType === 'line_trimmed'
                ? 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900'
                : 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900'
            }`}>
              {diff.metadata.matchType === 'exact' ? '✅ 精确匹配' : 
               diff.metadata.matchType === 'line_trimmed' ? '🔄 行级匹配' :
               diff.metadata.matchType === 'block_anchor' ? '🔍 锚点匹配' : '🔍 模糊匹配'}
              {diff.metadata.confidence && diff.metadata.confidence < 1 && 
                ` (${(diff.metadata.confidence * 100).toFixed(0)}%)`}
            </span>
          )}
          {diff.status === 'failed' && (
            <span className="text-xs text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900 px-2 py-0.5 rounded">
              ❌ 应用失败
            </span>
          )}
          {diff.status === 'retrying' && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900 px-2 py-0.5 rounded">
              🔄 重试中...
            </span>
          )}
          {diff.metadata?.retryCount && diff.metadata.retryCount > 0 && (
            <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900 px-2 py-0.5 rounded">
              🔁 第{diff.metadata.retryCount}次重试
            </span>
          )}
        </div>

        {/* 展开/收起按钮 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
          title={isExpanded ? '收起' : '展开详情'}
        >
          <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-xs text-gray-500 dark:text-gray-400`} />
        </button>
      </div>

      {/* 内容区域 */}
      <div className="p-3">
        {/* 错误信息显示 */}
        {diff.status === 'failed' && diff.metadata?.error && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
            <div className="flex items-start space-x-2">
              <i className="fas fa-exclamation-triangle text-red-500 dark:text-red-400 text-sm mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-red-800 dark:text-red-200 text-sm mb-1">
                  {diff.metadata.error.message}
                </div>
                {diff.metadata.error.suggestions.length > 0 && (
                  <div className="text-xs text-red-700 dark:text-red-300">
                    <div className="mb-1">建议解决方案：</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {diff.metadata.error.suggestions.slice(0, 3).map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 重试信息显示 */}
        {diff.metadata?.retryReason && (
          <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <div className="flex items-start space-x-2">
              <i className="fas fa-redo text-yellow-500 dark:text-yellow-400 text-sm mt-0.5" />
              <div className="flex-1">
                <div className="font-medium text-yellow-800 dark:text-yellow-200 text-sm mb-1">
                  重试原因：{diff.metadata.retryReason}
                </div>
                {diff.metadata.parentId && (
                  <div className="text-xs text-yellow-700 dark:text-yellow-300">
                    基于失败的修改 {diff.metadata.parentId.slice(-8)} 重新生成
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {/* 简洁预览 */}
        {!isExpanded && (
          <div className="space-y-2">
            {isSearchReplace ? (
              // SEARCH/REPLACE 格式预览
              <>
                {searchContent && (
                  <div className="diff-preview-old">
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">- </span>
                    <div className="text-sm text-gray-600 dark:text-gray-400 line-through inline-block">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          p: ({ children }) => <span>{children}</span>,
                          h1: ({ children }) => <span className="font-bold">{children}</span>,
                          h2: ({ children }) => <span className="font-bold">{children}</span>,
                          h3: ({ children }) => <span className="font-bold">{children}</span>,
                          strong: ({ children }) => <span className="font-bold">{children}</span>,
                          em: ({ children }) => <span className="italic">{children}</span>,
                          code: ({ children }) => <span className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs font-mono">{children}</span>
                        }}
                      >
                        {formatContent(searchContent, 80)}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                {replaceContent && (
                  <div className="diff-preview-new">
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">+ </span>
                    <div className="text-sm text-gray-700 dark:text-gray-300 inline-block">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          p: ({ children }) => <span>{children}</span>,
                          h1: ({ children }) => <span className="font-bold">{children}</span>,
                          h2: ({ children }) => <span className="font-bold">{children}</span>,
                          h3: ({ children }) => <span className="font-bold">{children}</span>,
                          strong: ({ children }) => <span className="font-bold">{children}</span>,
                          em: ({ children }) => <span className="italic">{children}</span>,
                          code: ({ children }) => <span className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs font-mono">{children}</span>
                        }}
                      >
                        {formatContent(replaceContent, 80)}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // 传统格式预览
              <>
                {diff.content?.old && (
                  <div className="diff-preview-old">
                    <span className="text-xs text-red-600 dark:text-red-400 font-medium">- </span>
                    <div className="text-sm text-gray-600 dark:text-gray-400 line-through inline-block">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                        components={{
                          p: ({ children }) => <span>{children}</span>,
                          h1: ({ children }) => <span className="font-bold">{children}</span>,
                          h2: ({ children }) => <span className="font-bold">{children}</span>,
                          h3: ({ children }) => <span className="font-bold">{children}</span>,
                          strong: ({ children }) => <span className="font-bold">{children}</span>,
                          em: ({ children }) => <span className="italic">{children}</span>,
                          code: ({ children }) => <span className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs font-mono">{children}</span>
                        }}
                      >
                        {formatContent(diff.content.old, 80)}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
                <div className="diff-preview-new">
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">+ </span>
                  <div className="text-sm text-gray-700 dark:text-gray-300 inline-block">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        p: ({ children }) => <span>{children}</span>,
                        h1: ({ children }) => <span className="font-bold">{children}</span>,
                        h2: ({ children }) => <span className="font-bold">{children}</span>,
                        h3: ({ children }) => <span className="font-bold">{children}</span>,
                        strong: ({ children }) => <span className="font-bold">{children}</span>,
                        em: ({ children }) => <span className="italic">{children}</span>,
                        code: ({ children }) => <span className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-xs font-mono">{children}</span>
                      }}
                    >
                      {formatContent(diff.content?.new || '', 80)}
                    </ReactMarkdown>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* 详细内容 */}
        {isExpanded && (
          <div className="space-y-3">
            {/* 位置信息 */}
            {diff.position?.anchor && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">插入位置:</div>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-mono bg-white dark:bg-gray-800 p-2 rounded border">
                  {diff.position.anchor}
                </div>
              </div>
            )}

            {/* 变更内容 */}
            <div className="space-y-2">
              {isSearchReplace ? (
                // SEARCH/REPLACE 格式详细显示
                <>
                  {searchContent && (
                    <div>
                      <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">查找内容:</div>
                      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-300 dark:border-red-600 p-2">
                        <div className="text-sm text-red-700 dark:text-red-300 prose prose-sm max-w-none prose-red">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              pre: ({ children }) => <pre className="bg-red-100/50 dark:bg-red-800/20 p-2 rounded text-xs overflow-x-auto">{children}</pre>,
                              code: ({ children, className }) => {
                                const isInline = !className
                                return isInline ? 
                                  <code className="bg-red-100 dark:bg-red-800 px-1 rounded text-xs font-mono">{children}</code> :
                                  <code className={className}>{children}</code>
                              }
                            }}
                          >
                            {searchContent}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {replaceContent && (
                    <div>
                      <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">替换为:</div>
                      <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-300 dark:border-green-600 p-2">
                        <div className="text-sm text-green-700 dark:text-green-300 prose prose-sm max-w-none prose-green">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              pre: ({ children }) => <pre className="bg-green-100/50 dark:bg-green-800/20 p-2 rounded text-xs overflow-x-auto">{children}</pre>,
                              code: ({ children, className }) => {
                                const isInline = !className
                                return isInline ? 
                                  <code className="bg-green-100 dark:bg-green-800 px-1 rounded text-xs font-mono">{children}</code> :
                                  <code className={className}>{children}</code>
                              }
                            }}
                          >
                            {replaceContent}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // 传统格式详细显示
                <>
                  {diff.content?.old && (
                    <div>
                      <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">删除:</div>
                      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-300 dark:border-red-600 p-2">
                        <div className="text-sm text-red-700 dark:text-red-300 prose prose-sm max-w-none prose-red">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeHighlight]}
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              pre: ({ children }) => <pre className="bg-red-100/50 dark:bg-red-800/20 p-2 rounded text-xs overflow-x-auto">{children}</pre>,
                              code: ({ children, className }) => {
                                const isInline = !className
                                return isInline ? 
                                  <code className="bg-red-100 dark:bg-red-800 px-1 rounded text-xs font-mono">{children}</code> :
                                  <code className={className}>{children}</code>
                              }
                            }}
                          >
                            {diff.content.old}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">
                      {diff.type === 'insert' ? '添加:' : '替换为:'}
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-300 dark:border-green-600 p-2">
                      <div className="text-sm text-green-700 dark:text-green-300 prose prose-sm max-w-none prose-green">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeHighlight]}
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            pre: ({ children }) => <pre className="bg-green-100/50 dark:bg-green-800/20 p-2 rounded text-xs overflow-x-auto">{children}</pre>,
                            code: ({ children, className }) => {
                              const isInline = !className
                              return isInline ? 
                                <code className="bg-green-100 dark:bg-green-800 px-1 rounded text-xs font-mono">{children}</code> :
                                <code className={className}>{children}</code>
                            }
                          }}
                        >
                          {diff.content?.new || ''}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      {diff.status === 'pending' && (
        <div className="flex items-center justify-end space-x-2 p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
          <button
            onClick={handleReject}
            className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700 transition-colors"
            title="拒绝此修改"
          >
            <i className="fas fa-times mr-1" />
            拒绝
          </button>
          <button
            onClick={handleAccept}
            className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded-lg transition-colors"
            title="接受此修改"
          >
            <i className="fas fa-check mr-1" />
            接受
          </button>
        </div>
      )}

      {/* 失败状态的操作按钮 */}
      {diff.status === 'failed' && (
        <div className="flex items-center justify-between p-3 border-t border-red-100 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20">
          <div className="text-xs text-red-600 dark:text-red-400">
            修改应用失败
          </div>
          <div className="flex space-x-2">
            {onRetry && (
              <button
                onClick={() => onRetry(diff.id)}
                className="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors"
                title="要求 AI 重新生成此修改"
              >
                <i className="fas fa-redo mr-1" />
                重新生成
              </button>
            )}
            <button
              onClick={handleReject}
              className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/20 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
              title="忽略此修改"
            >
              <i className="fas fa-times mr-1" />
              忽略
            </button>
          </div>
        </div>
      )}

      {/* 状态提示 */}
      {diff.status !== 'pending' && diff.status !== 'retrying' && (
        <div className={`text-center py-2 text-xs font-medium ${
          diff.status === 'accepted' 
            ? 'text-green-600 dark:text-green-400' 
            : diff.status === 'failed'
            ? 'text-red-600 dark:text-red-400'
            : 'text-gray-600 dark:text-gray-400'
        }`}>
          <i className={`fas ${
            diff.status === 'accepted' ? 'fa-check-circle' : 
            diff.status === 'failed' ? 'fa-exclamation-circle' :
            'fa-times-circle'
          } mr-1`} />
          {diff.status === 'accepted' ? '已接受' : 
           diff.status === 'failed' ? '已失败' : '已拒绝'}
        </div>
      )}

      {/* 重试状态提示 */}
      {diff.status === 'retrying' && (
        <div className="text-center py-2 text-xs font-medium text-yellow-600 dark:text-yellow-400">
          <i className="fas fa-spinner fa-spin mr-1" />
          正在重新生成修改...
        </div>
      )}
    </div>
  )
}