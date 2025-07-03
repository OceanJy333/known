'use client'

import { useState, useEffect, useRef } from 'react'
import { DiffAction } from './DiffCard'

interface DiffAnnotationProps {
  diff: DiffAction
  onAccept: (diffId: string) => void
  onReject: (diffId: string) => void
  isVisible?: boolean
}

export default function DiffAnnotation({ 
  diff, 
  onAccept, 
  onReject, 
  isVisible = true 
}: DiffAnnotationProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const annotationRef = useRef<HTMLDivElement>(null)

  // 处理接受操作
  const handleAccept = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onAccept(diff.id)
  }

  // 处理拒绝操作
  const handleReject = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    onReject(diff.id)
  }

  // 获取状态样式
  const getStatusStyle = () => {
    switch (diff.status) {
      case 'accepted':
        return {
          container: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700',
          text: 'text-green-700 dark:text-green-300'
        }
      case 'rejected':
        return {
          container: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700',
          text: 'text-red-700 dark:text-red-300'
        }
      default:
        return {
          container: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/30',
          text: 'text-blue-700 dark:text-blue-300'
        }
    }
  }

  const statusStyle = getStatusStyle()

  if (!isVisible) return null

  return (
    <div 
      ref={annotationRef}
      className={`diff-annotation relative my-3 mx-2 ${statusStyle.container}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Cursor 风格的 diff 展示 */}
      <div className="space-y-2 p-3 border rounded-lg transition-all duration-200">
        {/* 删除的内容（红色删除线） */}
        {diff.content?.old && (
          <div className="diff-old-content">
            <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1 flex items-center">
              <i className="fas fa-minus mr-1" />
              删除:
            </div>
            <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded border-l-4 border-red-300 dark:border-red-600">
              <span className="text-sm text-red-700 dark:text-red-300 line-through whitespace-pre-wrap">
                {diff.content?.old}
              </span>
            </div>
          </div>
        )}

        {/* 新增的内容（绿色背景） */}
        <div className="diff-new-content">
          <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1 flex items-center">
            <i className="fas fa-plus mr-1" />
            {diff.type === 'insert' ? '添加:' : '替换为:'}
          </div>
          <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded border-l-4 border-green-300 dark:border-green-600">
            <span className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap">
              {diff.content?.new}
            </span>
          </div>
        </div>

        {/* 操作按钮 - 右下角 */}
        {diff.status === 'pending' && (
          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              onClick={handleReject}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded border border-red-200 dark:border-red-700 transition-colors"
              title="拒绝此修改"
            >
              <i className="fas fa-times mr-1" />
              拒绝
            </button>
            <button
              onClick={handleAccept}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 rounded transition-colors"
              title="接受此修改"
            >
              <i className="fas fa-check mr-1" />
              接受
            </button>
          </div>
        )}

        {/* 状态标识 */}
        {diff.status !== 'pending' && (
          <div className={`text-center py-1 text-xs font-medium ${statusStyle.text}`}>
            <i className={`fas ${diff.status === 'accepted' ? 'fa-check-circle' : 'fa-times-circle'} mr-1`} />
            {diff.status === 'accepted' ? '已接受' : '已拒绝'}
          </div>
        )}
      </div>

      {/* 浮动提示信息 */}
      {showTooltip && diff.status === 'pending' && (
        <div className="absolute left-full top-0 ml-2 z-50 w-64 p-2 bg-black/80 text-white text-xs rounded-lg shadow-lg backdrop-blur-sm">
          <div className="font-medium mb-1">
            {diff.type === 'insert' && '新增内容'}
            {diff.type === 'delete' && '删除内容'}  
            {diff.type === 'replace' && '替换内容'}
          </div>
          {diff.position?.anchor && (
            <div className="text-gray-300">
              位置: {diff.position?.anchor?.substring(0, 50)}...
            </div>
          )}
        </div>
      )}
    </div>
  )
}