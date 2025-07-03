'use client'

import { useMemo } from 'react'
import { DiffAction } from './DiffCard'

interface DiffPreviewProps {
  originalContent: string
  diffs: DiffAction[]
  currentDiffId?: string
  onDiffClick?: (diffId: string) => void
}

interface DiffSegment {
  type: 'unchanged' | 'deleted' | 'added'
  content: string
  diffId?: string
  position: number
}

export default function DiffPreview({ 
  originalContent, 
  diffs, 
  currentDiffId,
  onDiffClick 
}: DiffPreviewProps) {
  
  // 计算应用 diff 后的内容段落
  const segments = useMemo(() => {
    const result: DiffSegment[] = []
    let workingContent = originalContent
    let currentPosition = 0
    
    // 获取待处理和已接受的 diff
    const activeDiffs = diffs.filter(d => d.status === 'pending' || d.status === 'accepted')
    
    // 按位置排序 diff
    const sortedDiffs = [...activeDiffs].sort((a, b) => {
      const getPriority = (diff: DiffAction) => {
        if (diff.position?.anchor) {
          const index = originalContent.indexOf(diff.position.anchor)
          return index !== -1 ? index : Infinity
        }
        return Infinity
      }
      return getPriority(a) - getPriority(b)
    })
    
    // 应用每个 diff
    sortedDiffs.forEach(diff => {
      if (diff.type === 'replace' && diff.content?.old) {
        const oldIndex = workingContent.indexOf(diff.content.old, currentPosition)
        if (oldIndex !== -1) {
          // 添加未改变的部分
          if (oldIndex > currentPosition) {
            result.push({
              type: 'unchanged',
              content: workingContent.slice(currentPosition, oldIndex),
              position: currentPosition
            })
          }
          
          // 添加删除的部分
          result.push({
            type: 'deleted',
            content: diff.content.old,
            diffId: diff.id,
            position: oldIndex
          })
          
          // 添加新增的部分
          result.push({
            type: 'added',
            content: diff.content?.new || '',
            diffId: diff.id,
            position: oldIndex
          })
          
          currentPosition = oldIndex + diff.content.old.length
        }
      } else if (diff.type === 'insert' && diff.position?.anchor) {
        const anchorIndex = workingContent.indexOf(diff.position.anchor, currentPosition)
        if (anchorIndex !== -1) {
          const insertPosition = anchorIndex + diff.position.anchor.length
          
          // 添加到插入点之前的内容
          if (insertPosition > currentPosition) {
            result.push({
              type: 'unchanged',
              content: workingContent.slice(currentPosition, insertPosition),
              position: currentPosition
            })
          }
          
          // 添加插入的内容
          result.push({
            type: 'added',
            content: '\n\n' + (diff.content?.new || '') + '\n\n',
            diffId: diff.id,
            position: insertPosition
          })
          
          currentPosition = insertPosition
        }
      } else if (diff.type === 'delete' && diff.content?.old) {
        const deleteIndex = workingContent.indexOf(diff.content.old, currentPosition)
        if (deleteIndex !== -1) {
          // 添加删除前的内容
          if (deleteIndex > currentPosition) {
            result.push({
              type: 'unchanged',
              content: workingContent.slice(currentPosition, deleteIndex),
              position: currentPosition
            })
          }
          
          // 添加删除的内容
          result.push({
            type: 'deleted',
            content: diff.content.old,
            diffId: diff.id,
            position: deleteIndex
          })
          
          currentPosition = deleteIndex + diff.content.old.length
        }
      }
    })
    
    // 添加剩余的内容
    if (currentPosition < workingContent.length) {
      result.push({
        type: 'unchanged',
        content: workingContent.slice(currentPosition),
        position: currentPosition
      })
    }
    
    return result
  }, [originalContent, diffs])
  
  // 渲染单个段落
  const renderSegment = (segment: DiffSegment, index: number) => {
    const isCurrentDiff = segment.diffId === currentDiffId
    
    const baseClasses = `whitespace-pre-wrap font-mono text-sm leading-relaxed transition-all duration-200`
    const typeClasses = {
      unchanged: 'text-gray-700 dark:text-gray-300',
      deleted: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 line-through decoration-2 px-1 rounded',
      added: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-1 rounded'
    }
    
    const currentClasses = isCurrentDiff ? 'ring-2 ring-blue-400 dark:ring-blue-500' : ''
    const clickableClasses = segment.diffId ? 'cursor-pointer hover:opacity-80' : ''
    
    return (
      <span
        key={index}
        className={`${baseClasses} ${typeClasses[segment.type]} ${currentClasses} ${clickableClasses}`}
        onClick={() => segment.diffId && onDiffClick?.(segment.diffId)}
        title={segment.diffId ? `点击查看 Diff #${segment.diffId}` : undefined}
        data-diff-segment={segment.type}
      >
        {segment.content}
      </span>
    )
  }
  
  // 统计信息
  const stats = {
    additions: segments.filter(s => s.type === 'added').length,
    deletions: segments.filter(s => s.type === 'deleted').length,
    changes: diffs.filter(d => d.status === 'pending' || d.status === 'accepted').length
  }
  
  return (
    <div className="diff-preview-inline">
      {/* 统计信息条 */}
      <div className="flex items-center justify-between px-4 py-2 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-3 text-xs">
          <span className="text-gray-600 dark:text-gray-400">Diff 预览</span>
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1 text-green-600 dark:text-green-400">
              <i className="fas fa-plus-circle"></i>
              <span>{stats.additions}</span>
            </span>
            <span className="flex items-center space-x-1 text-red-600 dark:text-red-400">
              <i className="fas fa-minus-circle"></i>
              <span>{stats.deletions}</span>
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              共 {stats.changes} 处修改
            </span>
          </div>
        </div>
      </div>
      
      {/* 预览内容 */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <div className="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          {segments.map((segment, index) => renderSegment(segment, index))}
        </div>
      </div>
    </div>
  )
}