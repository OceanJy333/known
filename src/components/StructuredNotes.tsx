'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import MarkdownRenderer from './MarkdownRenderer'
import { DiffAction } from './DiffCard'

interface StructuredNotesProps {
  originalContent: string
  onClose?: () => void
  onHideToc?: () => void
  onNotesChange?: (notes: string) => void  // 新增：笔记内容变更回调
  // Diff 相关 props
  diffs?: DiffAction[]
  currentDiffId?: string
  onDiffClick?: (diffId: string) => void
  onAcceptDiff?: (diffId: string) => void
  onRejectDiff?: (diffId: string) => void
  applyAcceptedDiffs?: (content: string) => string
}

export default function StructuredNotes({ 
  originalContent, 
  onClose,
  onHideToc,
  onNotesChange,
  diffs = [],
  currentDiffId,
  onDiffClick,
  onAcceptDiff,
  onRejectDiff,
  applyAcceptedDiffs
}: StructuredNotesProps) {
  const [notes, setNotes] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 使用ref来跟踪上次的状态，避免useEffect依赖问题
  const lastStateRef = useRef({ content: '' })
  const [isFirstMount, setIsFirstMount] = useState(true)

  // 优化的 diff 状态分离和内容计算
  const { pendingDiffs, notesWithAppliedDiffs, hasAcceptedDiffs } = useMemo(() => {
    const pending = diffs.filter(d => d.status === 'pending')
    const accepted = diffs.filter(d => d.status === 'accepted')
    
    // 计算应用了已接受 diff 的笔记内容
    let processedNotes = notes
    if (notes && applyAcceptedDiffs) {
      try {
        processedNotes = applyAcceptedDiffs(notes)
      } catch (error) {
        console.warn('Failed to apply accepted diffs to notes:', error)
        processedNotes = notes // 出错时使用原始笔记
      }
    }
    
    return {
      pendingDiffs: pending,
      notesWithAppliedDiffs: processedNotes,
      hasAcceptedDiffs: accepted.length > 0
    }
  }, [diffs, notes, applyAcceptedDiffs])

  // 当有已接受的 diff 时，同步更新 notes 状态
  useEffect(() => {
    if (hasAcceptedDiffs && notesWithAppliedDiffs !== notes && notes.length > 0) {
      // 同步已接受的 diff 到笔记状态
      setNotes(notesWithAppliedDiffs)
      onNotesChange?.(notesWithAppliedDiffs)
    }
  }, [hasAcceptedDiffs, notesWithAppliedDiffs, notes.length, onNotesChange])

  useEffect(() => {
    // 只在首次挂载或原文内容变化时重新生成笔记
    const contentChanged = originalContent !== lastStateRef.current.content
    const shouldRegenerate = isFirstMount || contentChanged

    if (shouldRegenerate) {
      // 检测到需要重新生成笔记
      
      lastStateRef.current = {
        content: originalContent
      }
      setIsFirstMount(false)
      generateNotes()
    }

    return () => {
      // 组件卸载时取消请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [originalContent])

  const generateNotes = async () => {
    setIsGenerating(true)
    setError(null)
    setNotes('')
    onNotesChange?.('')  // 通知父组件笔记被清空
    
    // 自动隐藏目录，让用户专注于笔记生成
    onHideToc?.()
    
    // 生成笔记时的基本日志

    // 创建新的 AbortController
    abortControllerRef.current = new AbortController()

    try {
      // 发送请求生成笔记
      
      // 验证内容不为空
      if (!originalContent || originalContent.trim() === '') {
        throw new Error('内容为空，无法生成笔记')
      }

      const requestBody = JSON.stringify({
        content: originalContent,
      })
      
      console.log('生成笔记 - 请求体大小:', requestBody.length)

      const response = await fetch('/api/generate-notes-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('生成笔记失败')
      }

      if (!response.body) {
        throw new Error('响应流为空')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let accumulatedNotes = ''

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))

                switch (data.type) {
                  case 'content':
                    // 累积内容并更新显示
                    accumulatedNotes += data.content
                    setNotes(accumulatedNotes)
                    onNotesChange?.(accumulatedNotes)  // 通知父组件笔记内容变更
                    break

                  case 'complete':
                    setIsGenerating(false)
                    break

                  case 'error':
                    throw new Error(data.error)
                }
              } catch (parseError) {
                console.warn('解析SSE数据失败:', parseError)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('生成笔记失败:', error)
        setError(error.message || '生成笔记时出错')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = () => {
    generateNotes()
  }


  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* 头部 */}
      <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="flex items-center justify-center w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-md">
            <i className="fas fa-pen-to-square text-blue-600 dark:text-blue-400 text-xs"></i>
          </div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-200">
            结构化笔记
          </h2>
          {isGenerating && (
            <div className="flex items-center space-x-1.5 text-xs text-gray-500">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span>AI 正在生成笔记...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="重新生成"
          >
            <i className="fas fa-rotate-right text-xs"></i>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="关闭笔记"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto ios-scrollbar relative pr-6" ref={contentRef}>
        <div className="px-6 pt-1 pb-6">
          {error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : notes ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {/* 调试信息已移除 */}
              <MarkdownRenderer 
                content={notesWithAppliedDiffs}
                diffs={pendingDiffs}
                currentDiffId={currentDiffId}
                onDiffClick={onDiffClick}
                onAcceptDiff={onAcceptDiff}
                onRejectDiff={onRejectDiff}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-sm text-gray-500 dark:text-gray-400">准备生成结构化笔记...</p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  )
}