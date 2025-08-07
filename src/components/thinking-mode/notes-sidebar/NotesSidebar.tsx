'use client'

import React from 'react'
import { NotesCard } from './NotesCard'
import { NodesCard } from './NodesCard'
import { KnowledgeNote } from '@/types/knowledge'
import type { NodeType } from '@/types/nodeTypes'

interface NotesSidebarProps {
  onNoteSelect?: (note: KnowledgeNote) => void
  onNodeDragStart?: (nodeType: NodeType, event: DragEvent) => void
}

export function NotesSidebar({ onNoteSelect, onNodeDragStart }: NotesSidebarProps) {
  // 处理节点拖拽开始
  const handleNodeDragStart = onNodeDragStart || (() => {})

  return (
    <aside className="notes-sidebar">
      <div className="sidebar-content">
        {/* 笔记管理卡片 */}
        <div className="sidebar-section notes-section">
          <NotesCard onNoteSelect={onNoteSelect} />
        </div>

        {/* 节点工具箱卡片 */}
        <div className="sidebar-section nodes-section">
          <NodesCard 
            onNodeDragStart={handleNodeDragStart}
            isCanvasActive={true}
          />
        </div>
      </div>

      <style jsx>{`
        .notes-sidebar {
          width: 100%;
          height: 100%;
          background: #f8fafc;
          border-right: 1px solid rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
        }

        .sidebar-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          gap: 16px;
          padding: 16px;
        }

        .sidebar-section.notes-section {
          flex: 1;
          overflow: hidden;
        }

        .sidebar-section.nodes-section {
          flex-shrink: 0;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .notes-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            height: 100vh;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }

          .sidebar-content {
            padding: 12px;
            gap: 12px;
          }
        }

        /* 暗色模式 */
        @media (prefers-color-scheme: dark) {
          .notes-sidebar {
            background: #1f2937;
            border-right-color: rgba(255, 255, 255, 0.1);
          }
        }
      `}</style>
    </aside>
  )
}