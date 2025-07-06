'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { CanvasCard as CanvasCardType, Position, CARD_SIZES, CARD_CONTENT_CONFIG } from '@/types/canvas'
import { KnowledgeNote } from '@/types/knowledge'
import { mockNotes, mockTags } from '@/data/mockKnowledge'
import { HoverPreview } from './HoverPreview'
import { NoteDetailModal } from './NoteDetailModal'

interface CanvasCardProps {
  card: CanvasCardType
  isSelected: boolean
  onSelect: (isMulti: boolean) => void
  onPositionChange: (position: Position) => void
  onSizeChange: (size: CanvasCardType['size']) => void
  onRemove: () => void
}

export function CanvasCard({
  card,
  isSelected,
  onSelect,
  onPositionChange,
  onSizeChange,
  onRemove
}: CanvasCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [hoverTimer, setHoverTimer] = useState<NodeJS.Timeout | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  
  // 获取笔记数据
  const note = mockNotes.find(n => n.id === card.noteId)
  if (!note) return null
  
  // 获取当前尺寸的内容配置
  const contentConfig = CARD_CONTENT_CONFIG[card.size]
  
  // 获取标签信息
  const tags = note.tags
    .map(tagId => mockTags.find(tag => tag.id === tagId))
    .filter(Boolean)
    .slice(0, contentConfig.maxTags)

  // 内容截断函数
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  // 获取显示内容
  const displayContent = {
    title: truncateText(note.title, contentConfig.titleMaxLength),
    summary: truncateText(note.summary, contentConfig.contentMaxLength)
  }
  
  // 处理拖拽开始
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 阻止事件冒泡到画布
    e.stopPropagation()
    
    // 如果点击的是非标题区域，不启动拖拽
    const target = e.target as HTMLElement
    if (!target.closest('.card-header')) {
      return
    }
    
    // 选中卡片
    onSelect(e.ctrlKey || e.metaKey)
    
    // 记录拖拽偏移
    const rect = cardRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: e.clientX - card.position.x,
        y: e.clientY - card.position.y
      })
    }
    
    setIsDragging(true)
  }, [card.position, onSelect])
  
  // 处理拖拽移动
  useEffect(() => {
    if (!isDragging) return
    
    const handleMouseMove = (e: MouseEvent) => {
      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      }
      
      // 限制在画布边界内
      newPosition.x = Math.max(10, newPosition.x)
      newPosition.y = Math.max(10, newPosition.y)
      
      onPositionChange(newPosition)
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, onPositionChange])
  
  // 处理悬停开始
  const handleMouseEnter = useCallback(() => {
    if (isDragging || isResizing) return
    
    const timer = setTimeout(() => {
      setShowPreview(true)
    }, 1500) // 1.5秒后显示预览
    
    setHoverTimer(timer)
  }, [isDragging, isResizing])

  // 处理悬停结束
  const handleMouseLeave = useCallback(() => {
    if (hoverTimer) {
      clearTimeout(hoverTimer)
      setHoverTimer(null)
    }
    setShowPreview(false)
  }, [hoverTimer])

  // 处理双击查看详情
  const handleDoubleClick = useCallback(() => {
    setShowDetailModal(true)
  }, [])
  
  // 处理右键菜单
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    // TODO: 显示右键菜单
  }, [])

  // 处理尺寸切换
  const handleSizeToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setIsResizing(true)
    
    const sizes: CanvasCardType['size'][] = ['small', 'medium', 'large']
    const currentIndex = sizes.indexOf(card.size)
    const nextIndex = (currentIndex + 1) % sizes.length
    const nextSize = sizes[nextIndex]
    
    onSizeChange(nextSize)
    
    // 添加动画效果
    setTimeout(() => setIsResizing(false), 300)
  }, [card.size, onSizeChange])

  // 获取预览位置
  const getPreviewPosition = useCallback((): Position => {
    if (!cardRef.current) return { x: 0, y: 0 }
    
    const rect = cardRef.current.getBoundingClientRect()
    return {
      x: rect.right + 20,
      y: rect.top
    }
  }, [])
  
  const cardSize = CARD_SIZES[card.size]
  
  return (
    <>
      <div
        ref={cardRef}
        className={`canvas-card ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} size-${card.size}`}
        style={{
          left: card.position.x,
          top: card.position.y,
          width: cardSize.width,
          height: cardSize.height,
          zIndex: card.zIndex
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
      >
      {/* 卡片头部 - 可拖拽区域 */}
      <div className="card-header">
        <div className="card-icon">📄</div>
        <div className="card-title">{displayContent.title}</div>
        <button 
          className="card-close"
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          title="移除卡片"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
      
      {/* 卡片内容 */}
      <div className="card-content">
        <div className="card-summary">
          {displayContent.summary}
        </div>

        {/* 关键要点 - 仅在medium和large尺寸显示 */}
        {contentConfig.showKeyPoints && note.keyPoints && note.keyPoints.length > 0 && (
          <div className="card-keypoints">
            <div className="keypoints-title">关键要点</div>
            <ul className="keypoints-list">
              {note.keyPoints.slice(0, card.size === 'large' ? 4 : 2).map((point, index) => (
                <li key={index} className="keypoint-item">
                  <i className="fas fa-check"></i>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* 标签 */}
        {tags.length > 0 && (
          <div className="card-tags">
            {tags.map(tag => (
              <span 
                key={tag!.id} 
                className="card-tag"
                style={{ borderColor: tag!.color, color: tag!.color }}
              >
                {tag!.name}
              </span>
            ))}
          </div>
        )}
        
        {/* 元信息 */}
        <div className="card-meta">
          <span className="meta-item">
            <i className="fas fa-file-alt"></i>
            {note.wordCount}字
          </span>
          <span className="meta-item">
            <i className="fas fa-clock"></i>
            {note.readingTime}分钟
          </span>
          {note.isFavorite && (
            <span className="meta-item favorite">
              <i className="fas fa-star"></i>
            </span>
          )}
          {contentConfig.showMetadata && (
            <>
              <span className="meta-item">
                <i className="fas fa-eye"></i>
                {note.accessCount}次
              </span>
              {note.rating && (
                <span className="meta-item rating">
                  {Array.from({ length: note.rating }, (_, i) => (
                    <i key={i} className="fas fa-star"></i>
                  ))}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* 尺寸切换手柄 */}
      <button
        className="resize-handle"
        onMouseDown={handleSizeToggle}
        title={`切换尺寸 (当前: ${card.size})`}
      >
        <i className="fas fa-expand-alt"></i>
      </button>
      
      {/* 选中状态指示器 */}
      {isSelected && (
        <div className="selection-indicator">
          <div className="selection-handle top-left" />
          <div className="selection-handle top-right" />
          <div className="selection-handle bottom-left" />
          <div className="selection-handle bottom-right" />
        </div>
      )}
      </div>

      {/* 悬停预览 */}
      <HoverPreview
        note={note}
        position={getPreviewPosition()}
        isVisible={showPreview}
        onClose={() => setShowPreview(false)}
      />

      {/* 详情弹窗 */}
      <NoteDetailModal
        note={note}
        isVisible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />

      <style jsx>{`
        .canvas-card {
          position: absolute;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          cursor: default;
          user-select: none;
          transition: box-shadow 0.2s, transform 0.1s;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: cardEntry 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes cardEntry {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        .canvas-card:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        }

        .canvas-card.selected {
          box-shadow: 0 0 0 2px #3b82f6;
        }

        .canvas-card.dragging {
          cursor: grabbing;
          opacity: 0.9;
          z-index: 1000 !important;
        }

        .canvas-card.resizing {
          transform: scale(1.05);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          z-index: 999 !important;
        }

        /* 卡片头部 */
        .card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          cursor: grab;
          background: rgba(0, 0, 0, 0.02);
        }

        .card-header:active {
          cursor: grabbing;
        }

        .card-icon {
          font-size: 16px;
          flex-shrink: 0;
        }

        .card-title {
          flex: 1;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .card-close {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-size: 12px;
        }

        .card-close:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        /* 卡片内容 */
        .card-content {
          flex: 1;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow: hidden;
        }

        .card-summary {
          flex: 1;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.5;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }

        .card-tags {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .card-tag {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid;
          white-space: nowrap;
          background: rgba(59, 130, 246, 0.05);
        }

        .card-meta {
          display: flex;
          gap: 12px;
          align-items: center;
          font-size: 11px;
          color: #9ca3af;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .meta-item i {
          font-size: 10px;
        }

        .meta-item.favorite {
          color: #f59e0b;
        }

        .meta-item.rating i {
          font-size: 9px;
          color: #f59e0b;
        }

        /* 关键要点 */
        .card-keypoints {
          margin: 8px 0;
        }

        .keypoints-title {
          font-size: 11px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .keypoints-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .keypoint-item {
          display: flex;
          align-items: flex-start;
          gap: 6px;
          font-size: 11px;
          color: #4b5563;
          line-height: 1.3;
        }

        .keypoint-item i {
          color: #10b981;
          font-size: 9px;
          margin-top: 2px;
          flex-shrink: 0;
        }

        /* 尺寸切换手柄 */
        .resize-handle {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 20px;
          height: 20px;
          border: none;
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: all 0.2s;
          font-size: 10px;
        }

        .canvas-card:hover .resize-handle {
          opacity: 1;
        }

        .resize-handle:hover {
          background: rgba(59, 130, 246, 0.2);
          transform: scale(1.1);
        }

        .resize-handle:active {
          transform: scale(0.95);
        }

        /* 选中指示器 */
        .selection-indicator {
          position: absolute;
          inset: -2px;
          pointer-events: none;
        }

        .selection-handle {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #3b82f6;
          border: 2px solid white;
          border-radius: 2px;
        }

        .selection-handle.top-left {
          top: -4px;
          left: -4px;
        }

        .selection-handle.top-right {
          top: -4px;
          right: -4px;
        }

        .selection-handle.bottom-left {
          bottom: -4px;
          left: -4px;
        }

        .selection-handle.bottom-right {
          bottom: -4px;
          right: -4px;
        }

        /* 不同尺寸的字体调整 */
        .canvas-card.size-small .card-title {
          font-size: 13px;
        }

        .canvas-card.size-small .card-summary {
          -webkit-line-clamp: 2;
          font-size: 11px;
        }

        .canvas-card.size-small .card-meta {
          font-size: 10px;
        }

        .canvas-card.size-medium .card-title {
          font-size: 14px;
        }

        .canvas-card.size-medium .card-summary {
          -webkit-line-clamp: 3;
        }

        .canvas-card.size-large .card-title {
          font-size: 15px;
        }

        .canvas-card.size-large .card-summary {
          -webkit-line-clamp: 5;
          font-size: 13px;
        }

        .canvas-card.size-large .card-meta {
          font-size: 12px;
        }

        /* 暗色模式 */
        @media (prefers-color-scheme: dark) {
          .canvas-card {
            background: #1f2937;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          }

          .card-header {
            background: rgba(255, 255, 255, 0.02);
            border-bottom-color: rgba(255, 255, 255, 0.08);
          }

          .card-title {
            color: #f3f4f6;
          }

          .card-summary {
            color: #9ca3af;
          }

          .card-close {
            color: #6b7280;
          }

          .card-close:hover {
            background: rgba(239, 68, 68, 0.2);
          }
        }
      `}</style>
    </>
  )
}