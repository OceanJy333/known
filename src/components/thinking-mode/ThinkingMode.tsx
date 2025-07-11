'use client'

import React, { useState } from 'react'
import { NotesSidebar } from './notes-sidebar'
import { CanvasArea } from './canvas'
import { KnowledgeNote } from '@/types/knowledge'
import { mockNotes } from '@/data/mockKnowledge'
import type { NodeType } from '@/types/nodeTypes'

export function ThinkingMode() {
  const [selectedNote, setSelectedNote] = useState<KnowledgeNote | null>(null)

  const handleNoteSelect = (note: KnowledgeNote) => {
    setSelectedNote(note)
  }

  const handleNodeDragStart = (nodeType: NodeType, event: DragEvent) => {
    // 可以在这里添加全局的拖拽状态管理
  }

  return (
    <div className="thinking-mode">
      {/* 三栏布局 */}
      <div className="thinking-layout">
        {/* 左侧：笔记管理 */}
        <aside className="notes-sidebar-container">
          <NotesSidebar 
            onNoteSelect={handleNoteSelect}
            onNodeDragStart={handleNodeDragStart}
          />
        </aside>
        
        {/* 右侧：画布工作区 */}
        <main className="canvas-workspace">
          <CanvasArea selectedNote={selectedNote} knowledgeBase={mockNotes} />
        </main>
      </div>

      <style jsx>{`
        .thinking-mode {
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .thinking-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          height: 100%;
          gap: 0;
        }

        .notes-sidebar-container {
          background: #f8fafc;
          border-right: 1px solid rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .canvas-workspace {
          background: #ffffff;
          position: relative;
          overflow: hidden;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .thinking-layout {
            grid-template-columns: 1fr;
            position: relative;
          }

          .notes-sidebar-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            z-index: 10;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }

          .notes-sidebar-container.mobile-open {
            transform: translateX(0);
          }

          .canvas-workspace {
            grid-column: 1;
          }
        }

        /* 暗色模式 */
        @media (prefers-color-scheme: dark) {
          .notes-sidebar-container {
            background: #1f2937;
            border-right-color: rgba(255, 255, 255, 0.1);
          }

          .canvas-workspace {
            background: #111827;
          }
        }
      `}</style>
    </div>
  )
}