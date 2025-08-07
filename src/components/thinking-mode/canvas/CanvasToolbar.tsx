'use client'

import React from 'react'

interface CanvasToolbarProps {
  transform: { x: number; y: number; scale: number }
  nodeCount: number
  cardCount: number
  connectionCount: number
  svgNodeCount?: number
  isAIInputVisible: boolean
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onFitToScreen: () => void
  onToggleAIInput: () => void
  onBatchExport?: () => void
}

export function CanvasToolbar({
  transform,
  nodeCount,
  cardCount,
  connectionCount,
  svgNodeCount = 0,
  isAIInputVisible,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToScreen,
  onToggleAIInput,
  onBatchExport
}: CanvasToolbarProps) {
  return (
    <div className="canvas-toolbar">
      <div className="toolbar-section">
        <button 
          className={`toolbar-btn ${isAIInputVisible ? 'active' : ''}`}
          title="AI提问"
          onClick={onToggleAIInput}
        >
          <i className="fas fa-robot"></i>
        </button>
        <button 
          className="toolbar-btn" 
          title="适应画布 (F)"
          onClick={onFitToScreen}
        >
          <i className="fas fa-compress"></i>
        </button>
        <button 
          className="toolbar-btn" 
          title="重置缩放 (Ctrl+0)"
          onClick={onZoomReset}
        >
          <i className="fas fa-undo"></i>
        </button>
        <button 
          className="toolbar-btn" 
          title="放大 (Ctrl++)" 
          onClick={onZoomIn}
          disabled={transform.scale >= 3}
        >
          <i className="fas fa-search-plus"></i>
        </button>
        <button 
          className="toolbar-btn" 
          title="缩小 (Ctrl+-)" 
          onClick={onZoomOut}
          disabled={transform.scale <= 0.1}
        >
          <i className="fas fa-search-minus"></i>
        </button>
        <span className="zoom-indicator">
          {Math.round(transform.scale * 100)}%
        </span>
        
        {/* 批量导出按钮 */}
        {svgNodeCount > 0 && onBatchExport && (
          <button
            className="toolbar-btn export-btn"
            title={`批量导出 (${svgNodeCount}个SVG卡片)`}
            onClick={onBatchExport}
          >
            <i className="fas fa-download"></i>
            <span className="export-count">{svgNodeCount}</span>
          </button>
        )}
      </div>
      
      <div className="toolbar-section">
        <span className="node-count">
          {nodeCount} 问题 | {cardCount} 笔记
        </span>
        {connectionCount > 0 && (
          <span className="connection-count">
            {connectionCount} 连接
          </span>
        )}
      </div>

      <style jsx>{`
        .canvas-toolbar {
          position: absolute;
          top: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 24px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 20px;
          padding: 8px 16px;
          z-index: 100;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
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
          border-radius: 8px;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          font-size: 14px;
        }

        .toolbar-btn:hover:not(:disabled) {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .toolbar-btn.active {
          background: #3b82f6;
          color: white;
        }

        .toolbar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .export-btn {
          width: auto;
          padding: 0 8px;
          min-width: 32px;
          position: relative;
        }

        .export-btn:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }

        .export-count {
          margin-left: 4px;
          font-size: 11px;
          font-weight: 600;
          background: #ef4444;
          color: white;
          border-radius: 8px;
          padding: 1px 4px;
          min-width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }

        .zoom-indicator {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
          min-width: 40px;
          text-align: center;
        }

        .node-count,
        .connection-count {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .connection-count {
          opacity: 0.8;
        }

        /* 暗色模式 */
        @media (prefers-color-scheme: dark) {
          .canvas-toolbar {
            background: rgba(31, 41, 55, 0.95);
            border-color: rgba(255, 255, 255, 0.1);
          }

          .toolbar-btn {
            color: #9ca3af;
          }

          .toolbar-btn:hover:not(:disabled) {
            background: rgba(59, 130, 246, 0.2);
            color: #60a5fa;
          }

          .zoom-indicator,
          .node-count,
          .connection-count {
            color: #9ca3af;
          }
        }
      `}</style>
    </div>
  )
}