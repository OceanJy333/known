'use client'

import React, { useState, useRef, useCallback } from 'react'
import type { BaseOutputNode, ConversationMessage } from '@/types/outputNode'
import { Position } from '@/types/canvas'

export interface BaseOutputNodeProps {
  node: BaseOutputNode
  isActive?: boolean
  onPositionChange?: (position: Position) => void
  onRemove?: () => void
  onToggleExpand?: () => void
  onMessageSend?: (message: string) => void
  children?: React.ReactNode
}

export function BaseOutputNode({
  node,
  isActive = false,
  onPositionChange,
  onRemove,
  onToggleExpand,
  onMessageSend,
  children
}: BaseOutputNodeProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [showActions, setShowActions] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)

  // 拖拽处理
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 只在点击头部时才开始拖拽
    const target = e.target as HTMLElement
    if (!target.closest('.node-header')) return
    
    e.preventDefault()
    e.stopPropagation()
    
    // 记录鼠标相对于节点当前位置的偏移
    const offsetX = e.clientX - node.position.x
    const offsetY = e.clientY - node.position.y
    
    setIsDragging(true)
    setDragOffset({ x: offsetX, y: offsetY })

    const handleMouseMove = (e: MouseEvent) => {
      if (!onPositionChange) return
      
      // 直接使用鼠标位置减去偏移计算新位置
      const newPosition = {
        x: e.clientX - offsetX,
        y: e.clientY - offsetY
      }
      onPositionChange(newPosition)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [node.position, onPositionChange])

  // 状态图标
  const getStatusIcon = () => {
    switch (node.status) {
      case 'idle': return 'fas fa-circle'
      case 'recalling': return 'fas fa-search fa-spin'
      case 'generating': return 'fas fa-magic fa-spin'
      case 'completed': return 'fas fa-check-circle'
      case 'error': return 'fas fa-exclamation-triangle'
      default: return 'fas fa-circle'
    }
  }

  // 状态文本
  const getStatusText = () => {
    switch (node.status) {
      case 'idle': return '待处理'
      case 'recalling': return '召回相关内容...'
      case 'generating': return '生成中...'
      case 'completed': return '已完成'
      case 'error': return '处理失败'
      default: return ''
    }
  }

  // 状态样式类
  const getStatusClass = () => {
    switch (node.status) {
      case 'idle': return 'status-idle'
      case 'recalling': return 'status-recalling'
      case 'generating': return 'status-generating'
      case 'completed': return 'status-completed'
      case 'error': return 'status-error'
      default: return ''
    }
  }

  return (
    <>
      <div
        ref={nodeRef}
        className={`output-node ${getStatusClass()} ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}`}
        style={{
          position: 'absolute',
          left: node.position.x,
          top: node.position.y,
          zIndex: isActive ? 1000 : 100
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* 节点头部 */}
        <div className="node-header">
          <div className="node-info">
            <div className="node-type">
              <i className={`node-type-icon ${getNodeTypeIcon()}`}></i>
              <span className="node-type-text">{getNodeTypeText()}</span>
            </div>
            <div className="node-status">
              <i className={`status-icon ${getStatusIcon()}`}></i>
              <span className="status-text">{getStatusText()}</span>
            </div>
          </div>

          {/* 操作按钮 */}
          {showActions && (
            <div className="node-actions">
              {onToggleExpand && (
                <button 
                  className="action-btn expand-btn"
                  onClick={onToggleExpand}
                  title="展开/收起"
                >
                  <i className="fas fa-expand-alt"></i>
                </button>
              )}
              {onRemove && (
                <button 
                  className="action-btn remove-btn"
                  onClick={onRemove}
                  title="删除节点"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 节点内容区域 */}
        <div className="node-content">
          {children}
        </div>

        {/* 连接点 */}
        <div className="connection-points">
          <div className="connection-point connection-point-top"></div>
          <div className="connection-point connection-point-right"></div>
          <div className="connection-point connection-point-bottom"></div>
          <div className="connection-point connection-point-left"></div>
        </div>
      </div>

      <style jsx>{`
        .output-node {
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.98), rgba(249, 250, 251, 0.95));
          border: 1px solid rgba(229, 231, 235, 0.8);
          border-radius: 20px;
          width: 480px;
          max-width: 90vw;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.02);
          cursor: default;
          user-select: none;
          backdrop-filter: blur(20px);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          overflow: hidden;
        }

        .output-node:hover {
          box-shadow: 0 6px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.04);
        }

        .output-node.active {
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 6px 32px rgba(59, 130, 246, 0.12), 0 0 0 2px rgba(59, 130, 246, 0.15);
        }

        .output-node.dragging {
          box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
          cursor: grabbing;
          transform: scale(1.02);
          opacity: 0.95;
        }

        /* 节点头部 */
        .node-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
          background: rgba(249, 250, 251, 0.5);
          cursor: move;
        }

        .node-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .node-type {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .node-type-icon {
          color: #6b7280;
          font-size: 14px;
        }

        .node-type-text {
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          letter-spacing: -0.01em;
        }

        .node-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-icon {
          font-size: 12px;
        }

        .status-text {
          font-size: 12px;
          color: #6b7280;
        }

        /* 状态样式 */
        .status-idle .status-icon {
          color: #9ca3af;
        }

        .status-recalling .status-icon {
          color: #3b82f6;
        }

        .status-generating .status-icon {
          color: #8b5cf6;
        }

        .status-completed .status-icon {
          color: #10b981;
        }

        .status-error .status-icon {
          color: #ef4444;
        }

        /* 操作按钮 */
        .node-actions {
          display: flex;
          gap: 6px;
          opacity: 0;
          transform: translateX(10px);
          transition: all 0.2s ease;
        }

        .output-node:hover .node-actions {
          opacity: 1;
          transform: translateX(0);
        }

        .action-btn {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.8);
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: rgba(255, 255, 255, 1);
          color: #374151;
          transform: scale(1.1);
        }

        .remove-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        /* 节点内容 */
        .node-content {
          padding: 0;
          min-height: 120px;
          max-height: 600px;
          display: flex;
          flex-direction: column;
        }

        /* 连接点 */
        .connection-points {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .connection-point {
          position: absolute;
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border: 2px solid white;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.2s ease;
          pointer-events: auto;
          cursor: crosshair;
        }

        .output-node:hover .connection-point {
          opacity: 1;
        }

        .connection-point-top {
          top: -6px;
          left: 50%;
          transform: translateX(-50%);
        }

        .connection-point-right {
          right: -6px;
          top: 50%;
          transform: translateY(-50%);
        }

        .connection-point-bottom {
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
        }

        .connection-point-left {
          left: -6px;
          top: 50%;
          transform: translateY(-50%);
        }

        .connection-point:hover {
          background: #1d4ed8;
          transform: scale(1.2);
        }
      `}</style>
    </>
  )

  // 辅助函数：获取节点类型图标
  function getNodeTypeIcon() {
    switch (node.type) {
      case 'ai-chat': return 'fas fa-comments'
      case 'html-page': return 'fas fa-code'
      case 'xiaohongshu': return 'fas fa-image'
      case 'podcast': return 'fas fa-microphone'
      case 'ppt': return 'fas fa-presentation'
      default: return 'fas fa-cog'
    }
  }

  // 辅助函数：获取节点类型文本
  function getNodeTypeText() {
    switch (node.type) {
      case 'ai-chat': return 'AI对话'
      case 'html-page': return 'HTML页面'
      case 'xiaohongshu': return '小红书图文'
      case 'podcast': return '播客音频'
      case 'ppt': return 'PPT演示'
      default: return '输出节点'
    }
  }
}