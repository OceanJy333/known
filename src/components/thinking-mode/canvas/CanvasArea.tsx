'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { CanvasCard } from './CanvasCard'
import { useCanvasStore } from './canvasStore'
import { KnowledgeNote } from '@/types/knowledge'
import { Position, CanvasCard as CanvasCardType, CANVAS_CONSTANTS } from '@/types/canvas'

interface CanvasAreaProps {
  selectedNote?: KnowledgeNote | null
}

export function CanvasArea({ selectedNote }: CanvasAreaProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [dropIndicatorPos, setDropIndicatorPos] = useState<Position | null>(null)
  
  const {
    cards,
    selectedCardIds,
    addCard,
    updateCard,
    removeCard,
    selectCard,
    clearSelection,
    canDropAt,
    getSmartPosition
  } = useCanvasStore()

  // 处理拖拽进入
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    
    setIsDraggingOver(true)
    
    // 更新放置指示器位置
    const smartPos = getSmartPosition(position)
    setDropIndicatorPos(smartPos)
  }, [getSmartPosition])

  // 处理拖拽离开
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // 确保是离开画布而不是子元素
    if (e.currentTarget === e.target) {
      setIsDraggingOver(false)
      setDropIndicatorPos(null)
    }
  }, [])

  // 处理放置
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    setDropIndicatorPos(null)
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'))
      
      if (dragData.type !== 'note') return
      
      // 检查是否已存在
      if (cards.some(card => card.noteId === dragData.noteId)) {
        console.warn('该笔记已在画布中')
        return
      }
      
      // 检查数量限制
      if (cards.length >= CANVAS_CONSTANTS.MAX_CARDS) {
        console.error('画布已达到最大卡片数量限制')
        return
      }
      
      if (!canvasRef.current) return
      
      const rect = canvasRef.current.getBoundingClientRect()
      const dropPosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      
      // 获取智能位置
      const finalPosition = getSmartPosition(dropPosition)
      
      // 添加卡片
      addCard({
        noteId: dragData.noteId,
        position: finalPosition
      })
    } catch (error) {
      console.error('Failed to parse drag data:', error)
    }
  }, [cards, addCard, getSmartPosition])

  // 处理画布点击（取消选择）
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      clearSelection()
    }
  }, [clearSelection])

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete键删除选中的卡片
      if (e.key === 'Delete' && selectedCardIds.length > 0) {
        selectedCardIds.forEach(id => removeCard(id))
      }
      
      // Ctrl/Cmd + A 全选
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        cards.forEach(card => selectCard(card.id, false))
      }
      
      // Escape 取消选择
      if (e.key === 'Escape') {
        clearSelection()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedCardIds, cards, removeCard, selectCard, clearSelection])

  // 从侧边栏选择笔记时自动添加到画布
  useEffect(() => {
    if (selectedNote && !cards.some(card => card.noteId === selectedNote.id)) {
      // 如果画布为空，放在中心；否则放在右侧
      const position = cards.length === 0
        ? { x: 400, y: 200 }
        : {
            x: Math.max(...cards.map(c => c.position.x)) + 300,
            y: 200
          }
      
      addCard({
        noteId: selectedNote.id,
        position: getSmartPosition(position)
      })
    }
  }, [selectedNote, cards, addCard, getSmartPosition])

  return (
    <div className="canvas-area-container">
      <div
        ref={canvasRef}
        className={`canvas-area ${isDraggingOver ? 'dragging-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
      >
        {/* 空状态提示 */}
        {cards.length === 0 && !isDraggingOver && (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-layer-group"></i>
            </div>
            <h3>画布工作区</h3>
            <p>从左侧拖拽笔记到这里，或选择笔记自动添加</p>
            <div className="tips">
              <div className="tip">
                <i className="fas fa-hand-pointer"></i>
                <span>拖拽笔记到画布</span>
              </div>
              <div className="tip">
                <i className="fas fa-mouse-pointer"></i>
                <span>点击选择，拖动移动</span>
              </div>
              <div className="tip">
                <i className="fas fa-expand"></i>
                <span>双击查看详情</span>
              </div>
            </div>
          </div>
        )}

        {/* 画布卡片 */}
        {cards.map(card => (
          <CanvasCard
            key={card.id}
            card={card}
            isSelected={selectedCardIds.includes(card.id)}
            onSelect={(isMulti) => selectCard(card.id, isMulti)}
            onPositionChange={(position) => updateCard(card.id, { position })}
            onSizeChange={(size) => updateCard(card.id, { size })}
            onRemove={() => removeCard(card.id)}
          />
        ))}

        {/* 放置指示器 */}
        {isDraggingOver && dropIndicatorPos && (
          <div
            className="drop-indicator"
            style={{
              left: dropIndicatorPos.x - 140,
              top: dropIndicatorPos.y - 100
            }}
          />
        )}
      </div>

      {/* 画布工具栏 */}
      <div className="canvas-toolbar">
        <div className="toolbar-section">
          <button className="toolbar-btn" title="适应画布 (F)">
            <i className="fas fa-compress"></i>
          </button>
          <button className="toolbar-btn" title="放大 (+)">
            <i className="fas fa-search-plus"></i>
          </button>
          <button className="toolbar-btn" title="缩小 (-)">
            <i className="fas fa-search-minus"></i>
          </button>
        </div>
        <div className="toolbar-section">
          <span className="card-count">
            {cards.length} / {CANVAS_CONSTANTS.MAX_CARDS} 卡片
          </span>
        </div>
      </div>

      <style jsx>{`
        .canvas-area-container {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          background: #fafbfc;
        }

        .canvas-area {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: auto;
          cursor: default;
          transition: background-color 0.2s;
        }

        .canvas-area.dragging-over {
          background-color: rgba(59, 130, 246, 0.02);
        }

        /* 空状态 */
        .empty-state {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: #6b7280;
          user-select: none;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: #6366f1;
        }

        .empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .empty-state p {
          font-size: 14px;
          margin-bottom: 24px;
        }

        .tips {
          display: flex;
          gap: 24px;
          justify-content: center;
        }

        .tip {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #9ca3af;
        }

        .tip i {
          font-size: 14px;
        }

        /* 放置指示器 */
        .drop-indicator {
          position: absolute;
          width: 280px;
          height: 200px;
          border: 2px dashed #3b82f6;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.05);
          pointer-events: none;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* 工具栏 */
        .canvas-toolbar {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 16px;
          z-index: 10;
        }

        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toolbar-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: #6b7280;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .toolbar-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .card-count {
          font-size: 12px;
          color: #9ca3af;
          white-space: nowrap;
        }

        /* 滚动条样式 */
        .canvas-area::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .canvas-area::-webkit-scrollbar-track {
          background: transparent;
        }

        .canvas-area::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }

        .canvas-area::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        /* 响应式 */
        @media (max-width: 768px) {
          .canvas-toolbar {
            bottom: 10px;
            right: 10px;
            padding: 6px 12px;
          }

          .toolbar-btn {
            width: 28px;
            height: 28px;
            font-size: 14px;
          }

          .tips {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  )
}