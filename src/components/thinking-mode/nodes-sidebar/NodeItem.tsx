'use client'

import React, { useState } from 'react'
import type { NodeType, NodeDragData } from '@/types/nodeTypes'

interface NodeItemProps {
  nodeType: NodeType
  onDragStart?: (nodeType: NodeType, event: DragEvent) => void
  disabled?: boolean
}

export function NodeItem({ nodeType, onDragStart, disabled = false }: NodeItemProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = (event: React.DragEvent) => {
    if (disabled) {
      event.preventDefault()
      return
    }
    
    setIsDragging(true)
    
    const dragData: NodeDragData = {
      type: 'node-template',
      id: nodeType.id,
      nodeType: nodeType.id,
      metadata: {
        title: nodeType.name,
        description: nodeType.description,
        defaultSize: nodeType.defaultSize
      }
    }
    
    event.dataTransfer.setData('application/json', JSON.stringify(dragData))
    event.dataTransfer.effectAllowed = 'copy'
    
    // 调用回调
    if (onDragStart) {
      onDragStart(nodeType, event.nativeEvent)
    }
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <div
      className={`node-item ${disabled ? 'disabled' : ''} ${isDragging ? 'dragging' : ''}`}
      draggable={!disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{ '--node-color': nodeType.color } as React.CSSProperties}
      title={nodeType.description}
    >
      <div className="node-icon">
        <i className={`fas ${nodeType.icon}`}></i>
      </div>
      <span className="node-name">{nodeType.name}</span>
      
      <style jsx>{`
        .node-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 8px;
          border-radius: 12px;
          cursor: grab;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(8px);
          position: relative;
          overflow: hidden;
          min-height: 70px;
          justify-content: center;
          gap: 6px;
        }

        .node-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--node-color);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .node-item:hover::before {
          opacity: 1;
        }

        .node-item:hover {
          background: rgba(255, 255, 255, 0.9);
          border-color: var(--node-color);
          transform: translateY(-2px);
          box-shadow: 
            0 4px 12px rgba(0, 0, 0, 0.1),
            0 2px 6px rgba(0, 0, 0, 0.06);
        }

        .node-item:active,
        .node-item.dragging {
          cursor: grabbing;
          transform: scale(0.95);
          opacity: 0.8;
        }

        .node-item.disabled {
          opacity: 0.5;
          cursor: not-allowed;
          pointer-events: none;
        }

        .node-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.05);
          margin-bottom: 2px;
          transition: all 0.2s ease;
        }

        .node-icon i {
          font-size: 14px;
          color: var(--node-color);
          transition: all 0.2s ease;
        }

        .node-item:hover .node-icon {
          background: var(--node-color);
          transform: scale(1.1);
        }

        .node-item:hover .node-icon i {
          color: white;
        }

        .node-name {
          font-size: 11px;
          font-weight: 500;
          color: #374151;
          text-align: center;
          line-height: 1.2;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .node-item:hover .node-name {
          color: var(--node-color);
        }

        /* 暗色模式支持 */
        @media (prefers-color-scheme: dark) {
          .node-item {
            background: rgba(30, 41, 59, 0.6);
            border-color: rgba(71, 85, 105, 0.3);
          }

          .node-item:hover {
            background: rgba(30, 41, 59, 0.9);
          }

          .node-icon {
            background: rgba(255, 255, 255, 0.1);
          }

          .node-name {
            color: #e2e8f0;
          }
        }
      `}</style>
    </div>
  )
}