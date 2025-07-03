'use client'

import { useState } from 'react'
import { DiffAction } from './DiffCard'

interface DiffSummaryBarProps {
  diffs: DiffAction[]
  onApplyAll: () => void
  onRejectAll: () => void
  className?: string
}

export default function DiffSummaryBar({ 
  diffs, 
  onApplyAll, 
  onRejectAll, 
  className = '' 
}: DiffSummaryBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 计算统计数据
  const pendingDiffs = diffs.filter(d => d.status === 'pending')
  const acceptedDiffs = diffs.filter(d => d.status === 'accepted')
  const rejectedDiffs = diffs.filter(d => d.status === 'rejected')

  // 如果没有 diffs，不显示
  if (diffs.length === 0) return null

  // 获取类型统计
  const getTypeStats = () => {
    const stats = {
      insert: diffs.filter(d => d.type === 'insert').length,
      delete: diffs.filter(d => d.type === 'delete').length,
      replace: diffs.filter(d => d.type === 'replace').length
    }
    return stats
  }

  const typeStats = getTypeStats()

  return (
    <div className={`diff-summary-bar ${className}`}>
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-blue-900/20 dark:to-indigo-900/20 backdrop-blur-sm border border-blue-200/50 dark:border-blue-700/50 rounded-lg shadow-sm">
        {/* 主要信息栏 */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* 左侧：统计信息 */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                AI 建议修改
              </span>
            </div>
            
            <div className="flex items-center space-x-3 text-xs">
              {pendingDiffs.length > 0 && (
                <div className="flex items-center space-x-1 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded-full">
                  <i className="fas fa-clock text-yellow-600 dark:text-yellow-400" />
                  <span className="text-yellow-700 dark:text-yellow-300">{pendingDiffs.length} 待处理</span>
                </div>
              )}
              
              {acceptedDiffs.length > 0 && (
                <div className="flex items-center space-x-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  <i className="fas fa-check text-green-600 dark:text-green-400" />
                  <span className="text-green-700 dark:text-green-300">{acceptedDiffs.length} 已接受</span>
                </div>
              )}
              
              {rejectedDiffs.length > 0 && (
                <div className="flex items-center space-x-1 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                  <i className="fas fa-times text-red-600 dark:text-red-400" />
                  <span className="text-red-700 dark:text-red-300">{rejectedDiffs.length} 已拒绝</span>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center space-x-2">
            {/* 详情切换 */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-black/20 rounded-lg transition-colors"
              title={isExpanded ? '收起详情' : '展开详情'}
            >
              <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} text-xs`} />
            </button>

            {/* 操作按钮 */}
            {pendingDiffs.length > 0 && (
              <>
                <button
                  onClick={onRejectAll}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg transition-colors"
                  title="拒绝所有修改"
                >
                  全部拒绝
                </button>
                <button
                  onClick={onApplyAll}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors shadow-sm"
                  title="应用所有修改"
                >
                  <i className="fas fa-check mr-1" />
                  全部应用
                </button>
              </>
            )}
          </div>
        </div>

        {/* 展开的详细信息 */}
        {isExpanded && (
          <div className="border-t border-blue-200/50 dark:border-blue-700/50 px-4 py-3 bg-blue-25/30 dark:bg-blue-900/10">
            <div className="grid grid-cols-3 gap-4 text-xs">
              {/* 类型统计 */}
              <div className="space-y-2">
                <div className="text-gray-600 dark:text-gray-400 font-medium">修改类型</div>
                <div className="space-y-1">
                  {typeStats.insert > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-green-600 dark:text-green-400">
                        <i className="fas fa-plus w-3 mr-1" />
                        新增
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">{typeStats.insert}</span>
                    </div>
                  )}
                  {typeStats.delete > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-red-600 dark:text-red-400">
                        <i className="fas fa-minus w-3 mr-1" />
                        删除
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">{typeStats.delete}</span>
                    </div>
                  )}
                  {typeStats.replace > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center text-blue-600 dark:text-blue-400">
                        <i className="fas fa-edit w-3 mr-1" />
                        替换
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">{typeStats.replace}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 进度信息 */}
              <div className="space-y-2">
                <div className="text-gray-600 dark:text-gray-400 font-medium">处理进度</div>
                <div className="space-y-2">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${diffs.length > 0 ? ((acceptedDiffs.length + rejectedDiffs.length) / diffs.length) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <div className="text-gray-600 dark:text-gray-400">
                    {acceptedDiffs.length + rejectedDiffs.length} / {diffs.length} 已处理
                  </div>
                </div>
              </div>

              {/* 快捷操作 */}
              <div className="space-y-2">
                <div className="text-gray-600 dark:text-gray-400 font-medium">快捷操作</div>
                <div className="space-y-1">
                  <button 
                    className="w-full text-left text-blue-600 dark:text-blue-400 hover:underline"
                    onClick={() => {
                      // 滚动到第一个待处理的 diff
                      const firstPending = document.querySelector('[data-diff-status="pending"]')
                      firstPending?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    }}
                  >
                    跳转到首个待处理
                  </button>
                  <button 
                    className="w-full text-left text-gray-600 dark:text-gray-400 hover:underline"
                    onClick={() => setIsExpanded(false)}
                  >
                    收起详情
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}