'use client'

import React from 'react'
import { NodePalette } from '../nodes-sidebar/NodePalette'
import type { NodeType } from '@/types/nodeTypes'

interface NodesCardProps {
  onNodeDragStart?: (nodeType: NodeType, event: DragEvent) => void
  isCanvasActive?: boolean
}

export function NodesCard({ onNodeDragStart, isCanvasActive = true }: NodesCardProps) {
  const handleNodeDragStart = (nodeType: NodeType, event: DragEvent) => {
    
    if (onNodeDragStart) {
      onNodeDragStart(nodeType, event)
    }
  }

  return (
    <div className="nodes-card">
      <div className="card-content">
        <NodePalette 
          onNodeDragStart={handleNodeDragStart}
          isCanvasActive={isCanvasActive}
        />
      </div>

      <style jsx>{`
        .nodes-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.06),
            0 4px 16px rgba(0, 0, 0, 0.04);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .nodes-card:hover {
          box-shadow: 
            0 12px 48px rgba(0, 0, 0, 0.1),
            0 6px 24px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .card-content {
          padding: 4px;
        }

        /* 暗色模式支持 */
        @media (prefers-color-scheme: dark) {
          .nodes-card {
            background: rgba(15, 23, 42, 0.95);
            border-color: rgba(71, 85, 105, 0.8);
            box-shadow: 
              0 8px 32px rgba(0, 0, 0, 0.3),
              0 4px 16px rgba(0, 0, 0, 0.2);
          }

          .nodes-card:hover {
            box-shadow: 
              0 12px 48px rgba(0, 0, 0, 0.4),
              0 6px 24px rgba(0, 0, 0, 0.3);
            border-color: rgba(59, 130, 246, 0.5);
          }
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .card-content {
            padding: 2px;
          }
        }
      `}</style>
    </div>
  )
}