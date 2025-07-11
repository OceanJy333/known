'use client'

import React, { useState } from 'react'
import { NodeItem } from './NodeItem'
import { NODE_TYPES } from '@/constants/nodeTypes'
import type { NodeType } from '@/types/nodeTypes'

interface NodePaletteProps {
  onNodeDragStart?: (nodeType: NodeType, event: DragEvent) => void
  className?: string
  isCanvasActive?: boolean
}

export function NodePalette({ 
  onNodeDragStart, 
  className = '', 
  isCanvasActive = true 
}: NodePaletteProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  const handleToggleExpand = () => {
    setIsExpanded(prev => !prev)
  }

  const handleNodeDragStart = (nodeType: NodeType, event: DragEvent) => {
    
    if (onNodeDragStart) {
      onNodeDragStart(nodeType, event)
    }
  }

  return (
    <div className={`node-palette ${className}`}>
      <div className="palette-header" onClick={handleToggleExpand}>
        <div className="header-content">
          <div className="header-left">
            <i className="fas fa-plus-circle header-icon"></i>
            <div className="header-text">
              <h3 className="palette-title">添加节点</h3>
              <p className="palette-subtitle">拖拽到画布中创建</p>
            </div>
          </div>
          <div className="header-right">
            <i className={`fas fa-chevron-${isExpanded ? 'up' : 'down'} expand-icon`}></i>
          </div>
        </div>
      </div>
      
      {isExpanded && (
        <div className="palette-content">
          <div className="node-grid">
            {NODE_TYPES.map(nodeType => (
              <NodeItem
                key={nodeType.id}
                nodeType={nodeType}
                onDragStart={handleNodeDragStart}
                disabled={!isCanvasActive}
              />
            ))}
          </div>
          
          {!isCanvasActive && (
            <div className="disabled-hint">
              <i className="fas fa-info-circle"></i>
              <span>请先激活画布后再添加节点</span>
            </div>
          )}
        </div>
      )}
      
      <style jsx>{`
        .node-palette {
          background: transparent;
          backdrop-filter: none;
          border: none;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: none;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .node-palette:hover {
          border-color: transparent;
          box-shadow: none;
        }

        .palette-header {
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid transparent;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(12px);
          border-radius: 16px;
          margin-bottom: 8px;
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }

        .palette-header:hover {
          background: rgba(59, 130, 246, 0.05);
          border-color: rgba(59, 130, 246, 0.3);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-icon {
          font-size: 18px;
          color: #3b82f6;
          width: 20px;
          text-align: center;
        }

        .header-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .palette-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          line-height: 1.2;
        }

        .palette-subtitle {
          margin: 0;
          font-size: 11px;
          color: #6b7280;
          line-height: 1.2;
        }

        .header-right {
          display: flex;
          align-items: center;
        }

        .expand-icon {
          font-size: 12px;
          color: #9ca3af;
          transition: all 0.2s ease;
        }

        .palette-header:hover .expand-icon {
          color: #3b82f6;
        }

        .palette-content {
          padding: 0;
          animation: expandIn 0.2s ease-out;
        }

        @keyframes expandIn {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 200px;
          }
        }

        .node-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 0;
        }

        .disabled-hint {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 12px;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.2);
          border-radius: 8px;
          font-size: 11px;
          color: #92400e;
        }

        .disabled-hint i {
          font-size: 10px;
        }

        /* 暗色模式支持 */
        @media (prefers-color-scheme: dark) {
          .palette-header {
            background: rgba(30, 41, 59, 0.8);
            border-color: rgba(71, 85, 105, 0.8);
          }

          .palette-header:hover {
            background: rgba(59, 130, 246, 0.1);
            border-color: rgba(59, 130, 246, 0.4);
          }

          .palette-title {
            color: #e2e8f0;
          }

          .palette-subtitle {
            color: #94a3b8;
          }

          .disabled-hint {
            background: rgba(251, 191, 36, 0.2);
            border-color: rgba(251, 191, 36, 0.3);
            color: #fbbf24;
          }
        }

        /* 响应式适配 */
        @media (max-width: 320px) {
          .node-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 6px;
          }

          .palette-header {
            padding: 12px;
          }

          .palette-content {
            padding: 0;
          }

          .header-icon {
            font-size: 16px;
          }

          .palette-title {
            font-size: 13px;
          }

          .palette-subtitle {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  )
}