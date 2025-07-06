'use client'

import React, { useState, useEffect } from 'react'
import { KnowledgeNote } from '@/types/knowledge'
import { mockTags } from '@/data/mockKnowledge'
import MarkdownRenderer from '@/components/MarkdownRenderer'

interface NoteDetailModalProps {
  note: KnowledgeNote | null
  isVisible: boolean
  onClose: () => void
  onEdit?: (note: KnowledgeNote) => void
}

export function NoteDetailModal({ note, isVisible, onClose, onEdit }: NoteDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'outline'>('content')
  const [isEditing, setIsEditing] = useState(false)

  // 重置状态当弹窗打开/关闭时
  useEffect(() => {
    if (isVisible) {
      setActiveTab('content')
      setIsEditing(false)
    }
  }, [isVisible])

  // ESC键关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        onClose()
      }
    }

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isVisible, onClose])

  if (!isVisible || !note) return null

  // 获取标签信息
  const tags = note.tags
    .map(tagId => mockTags.find(tag => tag.id === tagId))
    .filter(Boolean)

  // 生成大纲
  const generateOutline = (content: string) => {
    const lines = content.split('\n')
    const outline: Array<{ level: number; text: string; id: string }> = []
    
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('#')) {
        const level = (trimmed.match(/^#+/) || [''])[0].length
        const text = trimmed.replace(/^#+\s*/, '')
        if (text) {
          outline.push({
            level,
            text,
            id: `heading-${index}`
          })
        }
      }
    })
    
    return outline
  }

  const outline = generateOutline(note.content)

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  return (
    <>
      {/* 背景遮罩 */}
      <div className="modal-backdrop" onClick={onClose} />
      
      {/* 弹窗内容 */}
      <div className="note-detail-modal">
        {/* 头部 */}
        <div className="modal-header">
          <div className="header-left">
            <div className="note-icon">📄</div>
            <div className="note-info">
              <h1 className="note-title">{note.title}</h1>
              <div className="note-meta">
                <span>创建于 {formatDate(note.createdAt)}</span>
                <span>•</span>
                <span>更新于 {formatDate(note.updatedAt)}</span>
                <span>•</span>
                <span>{note.wordCount}字</span>
                <span>•</span>
                <span>{note.readingTime}分钟阅读</span>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="action-btn" title="最小化">
              <i className="fas fa-window-minimize"></i>
            </button>
            {onEdit && (
              <button 
                className={`action-btn ${isEditing ? 'active' : ''}`}
                onClick={() => setIsEditing(!isEditing)}
                title="编辑模式"
              >
                <i className="fas fa-edit"></i>
              </button>
            )}
            <button className="action-btn" onClick={onClose} title="关闭">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* 标签栏 */}
        <div className="modal-tabs">
          <button 
            className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            <i className="fas fa-file-alt"></i>
            <span>内容</span>
          </button>
          {outline.length > 0 && (
            <button 
              className={`tab-btn ${activeTab === 'outline' ? 'active' : ''}`}
              onClick={() => setActiveTab('outline')}
            >
              <i className="fas fa-list"></i>
              <span>大纲</span>
            </button>
          )}
        </div>

        {/* 主体内容 */}
        <div className="modal-body">
          <div className="content-area">
            {activeTab === 'content' && (
              <div className="content-tab">
                {isEditing ? (
                  <div className="edit-mode">
                    <textarea 
                      className="content-editor"
                      value={note.content}
                      placeholder="编辑笔记内容..."
                      readOnly // 暂时只读，后续可以添加编辑功能
                    />
                  </div>
                ) : (
                  <div className="read-mode">
                    <MarkdownRenderer 
                      content={note.content}
                      diffs={[]}
                      currentDiffId={undefined}
                      onDiffClick={() => {}}
                      onAcceptDiff={() => {}}
                      onRejectDiff={() => {}}
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'outline' && (
              <div className="outline-tab">
                <div className="outline-list">
                  {outline.map((item, index) => (
                    <div 
                      key={index}
                      className={`outline-item level-${item.level}`}
                      onClick={() => {
                        const element = document.getElementById(item.id)
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth' })
                        }
                      }}
                    >
                      <span className="outline-text">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 侧边栏 */}
          <div className="sidebar">
            {/* 标签管理 */}
            <div className="sidebar-section">
              <h3 className="section-title">标签</h3>
              <div className="tags-list">
                {tags.map(tag => (
                  <span 
                    key={tag!.id} 
                    className="tag-item"
                    style={{ borderColor: tag!.color, color: tag!.color }}
                  >
                    {tag!.name}
                  </span>
                ))}
              </div>
            </div>

            {/* 统计信息 */}
            <div className="sidebar-section">
              <h3 className="section-title">统计</h3>
              <div className="stats-list">
                <div className="stat-row">
                  <span className="stat-label">访问次数</span>
                  <span className="stat-value">{note.accessCount}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">字数</span>
                  <span className="stat-value">{note.wordCount}</span>
                </div>
                <div className="stat-row">
                  <span className="stat-label">阅读时间</span>
                  <span className="stat-value">{note.readingTime}分钟</span>
                </div>
                {note.rating && (
                  <div className="stat-row">
                    <span className="stat-label">评分</span>
                    <div className="rating">
                      {Array.from({ length: 5 }, (_, i) => (
                        <i 
                          key={i}
                          className={`fas fa-star ${i < note.rating! ? 'filled' : ''}`}
                        ></i>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="sidebar-section">
              <h3 className="section-title">操作</h3>
              <div className="action-buttons">
                <button className={`full-btn ${note.isFavorite ? 'favorited' : ''}`}>
                  <i className={`fas ${note.isFavorite ? 'fa-heart' : 'fa-heart-o'}`}></i>
                  <span>{note.isFavorite ? '已收藏' : '收藏'}</span>
                </button>
                <button className="full-btn">
                  <i className="fas fa-share"></i>
                  <span>分享</span>
                </button>
                <button className="full-btn">
                  <i className="fas fa-download"></i>
                  <span>导出</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 1000;
        }

        .note-detail-modal {
          position: fixed;
          inset: 5%;
          background: white;
          border-radius: 16px;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.2);
          z-index: 1001;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: modalSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          background: rgba(0, 0, 0, 0.02);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
          min-width: 0;
        }

        .note-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .note-info {
          flex: 1;
          min-width: 0;
        }

        .note-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px;
          line-height: 1.3;
        }

        .note-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #6b7280;
          flex-wrap: wrap;
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          width: 36px;
          height: 36px;
          border: none;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #374151;
        }

        .action-btn.active {
          background: #3b82f6;
          color: white;
        }

        .modal-tabs {
          display: flex;
          background: rgba(0, 0, 0, 0.02);
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        .tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: none;
          background: transparent;
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }

        .tab-btn:hover {
          color: #374151;
          background: rgba(0, 0, 0, 0.02);
        }

        .tab-btn.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background: rgba(59, 130, 246, 0.05);
        }

        .modal-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .content-area {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .content-tab,
        .outline-tab {
          max-width: none;
        }

        .read-mode {
          font-size: 15px;
          line-height: 1.7;
        }

        .content-editor {
          width: 100%;
          height: 400px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 16px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          font-size: 14px;
          resize: vertical;
          outline: none;
        }

        .content-editor:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .outline-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .outline-item {
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
          border-left: 3px solid transparent;
        }

        .outline-item:hover {
          background: rgba(59, 130, 246, 0.05);
          border-left-color: #3b82f6;
        }

        .outline-item.level-1 {
          font-weight: 600;
          font-size: 16px;
          margin-left: 0;
        }

        .outline-item.level-2 {
          font-weight: 500;
          font-size: 14px;
          margin-left: 16px;
        }

        .outline-item.level-3 {
          font-size: 13px;
          margin-left: 32px;
        }

        .outline-item.level-4,
        .outline-item.level-5,
        .outline-item.level-6 {
          font-size: 12px;
          margin-left: 48px;
          color: #6b7280;
        }

        .outline-text {
          color: #374151;
        }

        .sidebar {
          width: 280px;
          background: rgba(0, 0, 0, 0.02);
          border-left: 1px solid rgba(0, 0, 0, 0.08);
          overflow-y: auto;
          flex-shrink: 0;
        }

        .sidebar-section {
          padding: 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tags-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tag-item {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid;
          white-space: nowrap;
          background: rgba(59, 130, 246, 0.05);
        }

        .stats-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .stat-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stat-label {
          font-size: 13px;
          color: #6b7280;
        }

        .stat-value {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
        }

        .rating {
          display: flex;
          gap: 2px;
        }

        .rating i {
          font-size: 12px;
          color: #d1d5db;
        }

        .rating i.filled {
          color: #f59e0b;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .full-btn {
          width: 100%;
          height: 40px;
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
          font-size: 13px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .full-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .full-btn.favorited {
          background: #fef3c7;
          border-color: #f59e0b;
          color: #d97706;
        }

        /* 滚动条样式 */
        .content-area::-webkit-scrollbar,
        .sidebar::-webkit-scrollbar {
          width: 8px;
        }

        .content-area::-webkit-scrollbar-track,
        .sidebar::-webkit-scrollbar-track {
          background: transparent;
        }

        .content-area::-webkit-scrollbar-thumb,
        .sidebar::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }

        /* 响应式 */
        @media (max-width: 768px) {
          .note-detail-modal {
            inset: 2%;
          }

          .modal-body {
            flex-direction: column;
          }

          .sidebar {
            width: 100%;
            border-left: none;
            border-top: 1px solid rgba(0, 0, 0, 0.08);
          }

          .note-title {
            font-size: 18px;
          }

          .note-meta {
            font-size: 12px;
          }
        }
      `}</style>
    </>
  )
}