'use client'

import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Position } from '@/types/canvas'
import { KnowledgeNote } from '@/types/knowledge'

export interface QuestionNodeData {
  id: string
  question: string
  answer?: string
  status: 'pending' | 'answering' | 'processing' | 'answered' | 'error'
  relatedNotes: KnowledgeNote[]
  createdAt: Date
  keywords?: string[]
  confidence?: number
}

interface QuestionNodeProps {
  data: QuestionNodeData
  position: Position
  isSelected?: boolean
  onPositionChange?: (position: Position) => void
  onEdit?: (newQuestion: string) => void
  onDelete?: () => void
  onRetry?: () => void
  onToggleExpand?: () => void
  isExpanded?: boolean
  onNoteClick?: (noteId: string) => void
}

export function QuestionNode({
  data,
  position,
  isSelected = false,
  onPositionChange,
  onEdit,
  onDelete,
  onRetry,
  onToggleExpand,
  isExpanded = false,
  onNoteClick
}: QuestionNodeProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(data.question)
  const [showActions, setShowActions] = useState(false)

  const nodeRef = useRef<HTMLDivElement>(null)
  const editInputRef = useRef<HTMLTextAreaElement>(null)

  // 拖拽功能
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing) return

    const rect = nodeRef.current?.getBoundingClientRect()
    if (!rect) return

    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
    setIsDragging(true)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const newPosition = {
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      }

      onPositionChange?.(newPosition)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset, onPositionChange])

  // 编辑功能
  const handleEditStart = () => {
    setIsEditing(true)
    setEditingQuestion(data.question)
    setTimeout(() => {
      editInputRef.current?.focus()
      editInputRef.current?.select()
    }, 100)
  }

  const handleEditSave = () => {
    if (editingQuestion.trim() && editingQuestion !== data.question) {
      onEdit?.(editingQuestion.trim())
    }
    setIsEditing(false)
  }

  const handleEditCancel = () => {
    setEditingQuestion(data.question)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEditSave()
    }
    if (e.key === 'Escape') {
      handleEditCancel()
    }
  }

  // 状态样式类
  const getStatusClass = () => {
    switch (data.status) {
      case 'pending': return 'status-pending'
      case 'answering': return 'status-answering'
      case 'processing': return 'status-processing'
      case 'answered': return 'status-answered'
      case 'error': return 'status-error'
      default: return ''
    }
  }

  // 状态图标
  const getStatusIcon = () => {
    switch (data.status) {
      case 'pending': return 'fas fa-clock'
      case 'answering': return 'fas fa-spinner fa-spin'
      case 'processing': return 'fas fa-cog fa-spin'
      case 'answered': return 'fas fa-check-circle'
      case 'error': return 'fas fa-exclamation-triangle'
      default: return 'fas fa-question-circle'
    }
  }

  return (
    <div
      ref={nodeRef}
      className={`question-node ${getStatusClass()} ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''} ${isDragging ? 'dragging' : ''}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* 问题标题栏 */}
      <div className="question-header">
        <div className="question-status">
          <i className={getStatusIcon()}></i>
        </div>
        
        <div className="question-content">
          {isEditing ? (
            <textarea
              ref={editInputRef}
              value={editingQuestion}
              onChange={(e) => setEditingQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleEditSave}
              className="question-edit-input"
              rows={2}
            />
          ) : (
            <div className="question-text" onDoubleClick={handleEditStart}>
              {data.question}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className={`question-actions ${showActions ? 'visible' : ''}`}>
          {data.status === 'error' && (
            <button
              onClick={onRetry}
              className="action-btn retry-btn"
              title="重试"
            >
              <i className="fas fa-redo"></i>
            </button>
          )}
          
          <button
            onClick={handleEditStart}
            className="action-btn edit-btn"
            title="编辑问题"
          >
            <i className="fas fa-edit"></i>
          </button>
          
          <button
            onClick={onToggleExpand}
            className="action-btn expand-btn"
            title={isExpanded ? "收起" : "展开"}
          >
            <i className={`fas ${isExpanded ? 'fa-compress' : 'fa-expand'}`}></i>
          </button>
          
          <button
            onClick={onDelete}
            className="action-btn delete-btn"
            title="删除"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      </div>

      {/* 关键词标签 */}
      {data.keywords && data.keywords.length > 0 && (
        <div className="question-keywords">
          {data.keywords.slice(0, 3).map((keyword, index) => (
            <span key={index} className="keyword-tag">
              {keyword}
            </span>
          ))}
        </div>
      )}

      {/* 回答内容 */}
      {isExpanded && (
        <div className="answer-section">
          {data.status === 'answering' && (
            <div className="answering-indicator">
              <div className="answering-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="answering-text">AI正在思考中...</span>
            </div>
          )}

          {data.status === 'processing' && (
            <div className="processing-indicator">
              <div className="processing-skeleton">
                <div className="skeleton-line"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
              <span className="processing-text">正在布局卡片...</span>
            </div>
          )}

          {data.answer && (
            <div className="answer-content">
              <div className="answer-text">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight]}
                >
                  {data.answer}
                </ReactMarkdown>
              </div>
              
              {data.confidence && (
                <div className="confidence-indicator">
                  <span className="confidence-label">置信度:</span>
                  <div className="confidence-bar">
                    <div 
                      className="confidence-fill"
                      style={{ width: `${data.confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="confidence-value">{Math.round(data.confidence * 100)}%</span>
                </div>
              )}
            </div>
          )}

          {data.status === 'error' && (
            <div className="error-message">
              <i className="fas fa-exclamation-triangle"></i>
              <span>回答生成失败，请重试</span>
            </div>
          )}
        </div>
      )}

      {/* 相关笔记 */}
      {isExpanded && data.relatedNotes.length > 0 && (
        <div className="related-notes">
          <div className="related-notes-header">
            <i className="fas fa-link"></i>
            <span>相关笔记 ({data.relatedNotes.length})</span>
          </div>
          <div className="related-notes-list">
            {data.relatedNotes.slice(0, 5).map((note, index) => (
              <div
                key={note.id}
                className="related-note-item"
                onClick={() => onNoteClick?.(note.id)}
              >
                <div className="note-title">{note.title}</div>
                <div className="note-summary">{note.summary}</div>
                <div className="note-tags">
                  {note.tags.slice(0, 2).map((tag, tagIndex) => (
                    <span key={tagIndex} className="note-tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 元信息 */}
      <div className="question-meta">
        <span className="created-time">
          {data.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        {data.relatedNotes.length > 0 && (
          <span className="notes-count">
            <i className="fas fa-sticky-note"></i>
            {data.relatedNotes.length}
          </span>
        )}
      </div>

      {/* 连接点 */}
      <div className="connection-points">
        <div className="connection-point top"></div>
        <div className="connection-point right"></div>
        <div className="connection-point bottom"></div>
        <div className="connection-point left"></div>
      </div>

      {/* 样式定义 */}
      <style jsx>{`
        .question-node {
          min-width: 320px;
          max-width: 480px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 2px solid transparent;
          border-radius: 16px;
          box-shadow: 
            0 8px 24px rgba(0, 0, 0, 0.12),
            0 4px 8px rgba(0, 0, 0, 0.08);
          cursor: move;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          overflow: hidden;
          animation: nodeEntry 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .question-node:hover {
          box-shadow: 
            0 12px 32px rgba(0, 0, 0, 0.16),
            0 6px 12px rgba(0, 0, 0, 0.12);
        }

        .question-node.selected {
          border-color: #667eea;
          box-shadow: 
            0 12px 32px rgba(102, 126, 234, 0.2),
            0 6px 12px rgba(102, 126, 234, 0.15);
        }

        .question-node.dragging {
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.2),
            0 10px 20px rgba(0, 0, 0, 0.15);
          z-index: 1000;
        }

        .question-node.expanded {
          max-width: 600px;
        }

        /* 状态样式 */
        .question-node.status-pending {
          border-left: 4px solid #f59e0b;
        }

        .question-node.status-answering {
          border-left: 4px solid #3b82f6;
          background: rgba(59, 130, 246, 0.02);
        }

        .question-node.status-processing {
          border-left: 4px solid #8b5cf6;
          background: rgba(139, 92, 246, 0.02);
        }

        .question-node.status-answered {
          border-left: 4px solid #10b981;
        }

        .question-node.status-error {
          border-left: 4px solid #ef4444;
          background: rgba(239, 68, 68, 0.02);
        }

        .question-header {
          padding: 16px 20px;
          display: flex;
          align-items: flex-start;
          gap: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          position: relative;
        }

        .question-status {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 12px;
          color: white;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          flex-shrink: 0;
        }

        .status-pending .question-status {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        }

        .status-answering .question-status {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        }

        .status-processing .question-status {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
        }

        .status-answered .question-status {
          background: linear-gradient(135deg, #10b981 0%, #047857 100%);
        }

        .status-error .question-status {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        }

        .question-content {
          flex: 1;
          min-height: 24px;
        }

        .question-text {
          font-size: 15px;
          font-weight: 500;
          color: #374151;
          line-height: 1.5;
          cursor: text;
        }

        .question-edit-input {
          width: 100%;
          font-size: 15px;
          font-weight: 500;
          color: #374151;
          line-height: 1.5;
          border: 1px solid #667eea;
          border-radius: 6px;
          padding: 8px;
          background: white;
          resize: none;
          outline: none;
        }

        .question-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transform: translateX(8px);
          transition: all 0.2s ease;
        }

        .question-actions.visible {
          opacity: 1;
          transform: translateX(0);
        }

        .action-btn {
          width: 28px;
          height: 28px;
          border: none;
          border-radius: 6px;
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: rgba(107, 114, 128, 0.2);
          color: #374151;
          transform: scale(1.1);
        }

        .retry-btn:hover {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .edit-btn:hover {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        .delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .question-keywords {
          padding: 0 20px 12px;
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .keyword-tag {
          padding: 2px 8px;
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .answer-section {
          padding: 16px 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .answering-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 0;
          color: #6b7280;
        }

        .answering-dots {
          display: flex;
          gap: 4px;
        }

        .answering-dots span {
          width: 6px;
          height: 6px;
          background: #3b82f6;
          border-radius: 50%;
          animation: dot-bounce 1.4s infinite ease-in-out both;
        }

        .answering-dots span:nth-child(1) { animation-delay: -0.32s; }
        .answering-dots span:nth-child(2) { animation-delay: -0.16s; }

        .answering-text {
          font-size: 14px;
        }

        .processing-indicator {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px 0;
          color: #6b7280;
        }

        .processing-skeleton {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .skeleton-line {
          height: 12px;
          background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
          background-size: 200% 100%;
          border-radius: 6px;
          animation: skeleton-loading 1.5s infinite;
        }

        .skeleton-line.short {
          width: 60%;
        }

        .processing-text {
          font-size: 14px;
          color: #8b5cf6;
        }

        @keyframes skeleton-loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }

        .answer-content {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .answer-text {
          font-size: 14px;
          line-height: 1.6;
          color: #374151;
        }

        .answer-text :global(h1),
        .answer-text :global(h2),
        .answer-text :global(h3) {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .answer-text :global(p) {
          margin: 0 0 8px 0;
        }

        .answer-text :global(ul),
        .answer-text :global(ol) {
          margin: 0 0 8px 0;
          padding-left: 20px;
        }

        .answer-text :global(code) {
          background: rgba(0, 0, 0, 0.05);
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 13px;
        }

        .confidence-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #6b7280;
        }

        .confidence-bar {
          width: 60px;
          height: 4px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 2px;
          overflow: hidden;
        }

        .confidence-fill {
          height: 100%;
          background: linear-gradient(90deg, #ef4444 0%, #f59e0b 30%, #10b981 100%);
          transition: width 0.3s ease;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.1);
          border-radius: 8px;
          color: #dc2626;
          font-size: 14px;
        }

        .related-notes {
          margin-top: 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          padding-top: 16px;
        }

        .related-notes-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 13px;
          font-weight: 600;
          color: #6b7280;
        }

        .related-notes-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .related-note-item {
          padding: 10px 12px;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 0, 0, 0.05);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .related-note-item:hover {
          background: rgba(102, 126, 234, 0.05);
          border-color: rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }

        .note-title {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
        }

        .note-summary {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.4;
          margin-bottom: 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .note-tags {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .note-tag {
          padding: 1px 6px;
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
          border-radius: 8px;
          font-size: 10px;
        }

        .question-meta {
          padding: 8px 20px;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #9ca3af;
          background: rgba(0, 0, 0, 0.01);
        }

        .notes-count {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .connection-points {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .connection-point {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #667eea;
          border: 2px solid white;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .question-node:hover .connection-point {
          opacity: 1;
        }

        .connection-point.top {
          top: -4px;
          left: 50%;
          transform: translateX(-50%);
        }

        .connection-point.right {
          top: 50%;
          right: -4px;
          transform: translateY(-50%);
        }

        .connection-point.bottom {
          bottom: -4px;
          left: 50%;
          transform: translateX(-50%);
        }

        .connection-point.left {
          top: 50%;
          left: -4px;
          transform: translateY(-50%);
        }

        /* 动画 */
        @keyframes nodeEntry {
          0% {
            transform: scale(0.3);
            opacity: 0;
            filter: blur(10px);
          }
          60% {
            transform: scale(1.05);
            opacity: 0.8;
            filter: blur(2px);
          }
          100% {
            transform: scale(1);
            opacity: 1;
            filter: blur(0px);
          }
        }

        @keyframes dot-bounce {
          0%, 80%, 100% { 
            transform: scale(0);
            opacity: 0.5;
          } 
          40% { 
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}