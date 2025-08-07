'use client'

import React, { useEffect, useRef } from 'react'
import { ConnectionStatus } from '@/types/outputNode'
import { Position } from '@/types/canvas'

interface ConnectionContextMenuProps {
  isVisible: boolean
  position: Position
  connectionId: string
  currentStatus: ConnectionStatus
  onStatusChange: (connectionId: string, newStatus: ConnectionStatus) => void
  onDelete: (connectionId: string) => void
  onClose: () => void
}

export function ConnectionContextMenu({
  isVisible,
  position,
  connectionId,
  currentStatus,
  onStatusChange,
  onDelete,
  onClose
}: ConnectionContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVisible, onClose])

  // ESC键关闭菜单
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  // 状态配置
  const statusConfig = {
    [ConnectionStatus.ACTIVE]: {
      label: '激活状态',
      description: '作为上下文参与回答',
      color: 'text-blue-600',
      icon: '🔵'
    },
    [ConnectionStatus.RELATED]: {
      label: '相关状态',
      description: '相关但不参与上下文',
      color: 'text-gray-600',
      icon: '⚪'
    },
    [ConnectionStatus.DISABLED]: {
      label: '禁用状态',
      description: '用户手动断开',
      color: 'text-red-600',
      icon: '🔴'
    },
    [ConnectionStatus.NEW]: {
      label: '新建状态',
      description: '新召回的连接',
      color: 'text-green-600',
      icon: '🟢'
    }
  }

  const handleStatusChange = (newStatus: ConnectionStatus) => {
    onStatusChange(connectionId, newStatus)
    onClose()
  }

  const handleDelete = () => {
    onDelete(connectionId)
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-48 z-50"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -10px)'
      }}
    >
      {/* 当前状态显示 */}
      <div className="px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">当前状态:</span>
          <span className={`text-sm font-medium ${statusConfig[currentStatus].color}`}>
            {statusConfig[currentStatus].icon} {statusConfig[currentStatus].label}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {statusConfig[currentStatus].description}
        </p>
      </div>

      {/* 状态切换选项 */}
      <div className="py-1">
        <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
          切换状态
        </div>
        
        {Object.entries(statusConfig).map(([status, config]) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status as ConnectionStatus)}
            disabled={status === currentStatus}
            className={`
              w-full px-3 py-2 text-left text-sm hover:bg-gray-50 
              flex items-center gap-2 transition-colors
              ${status === currentStatus 
                ? 'bg-gray-100 cursor-not-allowed opacity-50' 
                : 'cursor-pointer'
              }
            `}
          >
            <span className="w-4 text-center">{config.icon}</span>
            <div className="flex-1">
              <div className={`font-medium ${config.color}`}>
                {config.label}
              </div>
              <div className="text-xs text-gray-500">
                {config.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 分割线 */}
      <div className="border-t border-gray-100 my-1" />

      {/* 删除选项 */}
      <button
        onClick={handleDelete}
        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 
                   flex items-center gap-2 transition-colors"
      >
        <span className="w-4 text-center">🗑️</span>
        <div className="flex-1">
          <div className="font-medium">删除连接</div>
          <div className="text-xs text-gray-500">
            永久删除此连接
          </div>
        </div>
      </button>

      {/* 快捷键提示 */}
      <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
        <div className="text-xs text-gray-500">
          <div className="flex justify-between">
            <span>双击连接线</span>
            <span>快速切换状态</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Backspace / Delete</span>
            <span>删除连接</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Space / Enter</span>
            <span>切换状态</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>ESC</span>
            <span>取消选中</span>
          </div>
        </div>
      </div>
    </div>
  )
}