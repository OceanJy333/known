'use client'

import React, { useState } from 'react'
import { KnowledgeNote } from '@/types/knowledge'
import { mockTags } from '@/data/mockKnowledge'
import { DragData } from '@/types/canvas'

interface NoteItemProps {
  note: KnowledgeNote
  isSelected: boolean
  onSelect: () => void
  showRelevance?: boolean
}

export function NoteItem({ note, isSelected, onSelect, showRelevance = false }: NoteItemProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  // 格式化日期
  const formatDate = (date: Date) => {
    const now = new Date()
    const noteDate = new Date(date)
    const diffDays = Math.floor((now.getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return '今天'
    if (diffDays === 1) return '昨天'
    if (diffDays <= 7) return `${diffDays}天前`
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)}周前`
    if (diffDays <= 365) return `${Math.floor(diffDays / 30)}个月前`
    return `${Math.floor(diffDays / 365)}年前`
  }

  // 获取标签信息
  const getNoteTags = () => {
    return note.tags
      .map(tagId => mockTags.find(tag => tag.id === tagId))
      .filter((tag): tag is NonNullable<typeof tag> => Boolean(tag))
      .slice(0, 3) // 最多显示3个标签
  }

  // 截断摘要
  const truncateSummary = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text
    return text.slice(0, maxLength) + '...'
  }

  // 计算阅读时间显示
  const getReadingTimeText = () => {
    if (note.readingTime <= 1) return '1分钟'
    return `${note.readingTime}分钟`
  }

  const tags = getNoteTags()

  // 处理拖拽开始
  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    
    // 准备拖拽数据
    const dragData: DragData = {
      type: 'note',
      noteId: note.id,
      noteTitle: note.title,
      noteSummary: note.summary,
      noteTags: note.tags
    }
    
    e.dataTransfer.setData('application/json', JSON.stringify(dragData))
    e.dataTransfer.effectAllowed = 'copy'
  }

  const handleDragEnd = () => {
    setIsDragging(false)
  }

  return (
    <div 
      className={`note-item ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* 紧凑模式显示 */}
      <div className="note-compact">
        <div className="note-header">
          <div className="note-icon">
            📄
          </div>
          <div className="note-title-area">
            <div className="note-title">{note.title}</div>
            {showRelevance && (
              <div className="relevance-score">相关度: 85%</div>
            )}
          </div>
          <div className="note-actions">
            {note.isFavorite && (
              <i className="fas fa-star favorite-icon" title="已收藏"></i>
            )}
            <span className="reading-time">{getReadingTimeText()}</span>
          </div>
        </div>

        {/* 悬停时显示详细信息 */}
        {isHovered && (
          <div className="note-details">
            <div className="note-summary">
              {truncateSummary(note.summary)}
            </div>
            
            <div className="note-meta">
              {/* 标签 */}
              {tags.length > 0 && (
                <div className="note-tags">
                  {tags.map(tag => (
                    <span 
                      key={tag.id} 
                      className="note-tag"
                      style={{ borderColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="more-tags">+{note.tags.length - 3}</span>
                  )}
                </div>
              )}
              
              {/* 底部信息 */}
              <div className="note-footer">
                <div className="note-stats">
                  <span className="note-date">{formatDate(note.createdAt)}</span>
                  <span className="note-separator">•</span>
                  <span className="note-words">{note.wordCount}字</span>
                  <span className="note-separator">•</span>
                  <span className="note-visits">访问{note.accessCount}次</span>
                </div>
                
                {note.rating && (
                  <div className="note-rating">
                    {Array.from({ length: 5 }, (_, i) => (
                      <i 
                        key={i}
                        className={`fas fa-star ${i < note.rating! ? 'filled' : ''}`}
                      ></i>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .note-item {
          margin-bottom: 2px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          background: transparent;
          border: 1px solid transparent;
        }

        .note-item:hover,
        .note-item.hovered {
          background: rgba(59, 130, 246, 0.03);
          border-color: rgba(59, 130, 246, 0.1);
        }

        .note-item.selected {
          background: rgba(59, 130, 246, 0.08);
          border-color: rgba(59, 130, 246, 0.2);
        }

        .note-item.dragging {
          opacity: 0.5;
          cursor: grabbing;
        }

        .note-compact {
          padding: 8px 12px;
        }

        .note-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .note-icon {
          font-size: 14px;
          flex-shrink: 0;
        }

        .note-title-area {
          flex: 1;
          min-width: 0;
        }

        .note-title {
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          line-height: 1.3;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        .relevance-score {
          font-size: 11px;
          color: #059669;
          font-weight: 500;
          margin-top: 2px;
        }

        .note-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .favorite-icon {
          color: #f59e0b;
          font-size: 11px;
        }

        .reading-time {
          font-size: 11px;
          color: #6b7280;
          background: rgba(0, 0, 0, 0.04);
          padding: 2px 6px;
          border-radius: 4px;
        }

        .note-details {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          animation: slideDown 0.15s ease-out;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .note-summary {
          font-size: 12px;
          color: #6b7280;
          line-height: 1.4;
          margin-bottom: 8px;
        }

        .note-meta {
          space-y: 6px;
        }

        .note-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          margin-bottom: 6px;
        }

        .note-tag {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          background: rgba(59, 130, 246, 0.08);
          color: #3b82f6;
          border: 1px solid;
          white-space: nowrap;
        }

        .more-tags {
          font-size: 10px;
          color: #6b7280;
          padding: 2px 4px;
        }

        .note-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .note-stats {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          color: #9ca3af;
        }

        .note-separator {
          opacity: 0.5;
        }

        .note-rating {
          display: flex;
          gap: 1px;
        }

        .note-rating i {
          font-size: 9px;
          color: #d1d5db;
        }

        .note-rating i.filled {
          color: #f59e0b;
        }

        .note-date,
        .note-words,
        .note-visits {
          white-space: nowrap;
        }

        /* 暗色模式 */
        @media (prefers-color-scheme: dark) {
          .note-item:hover,
          .note-item.hovered {
            background: rgba(59, 130, 246, 0.1);
            border-color: rgba(59, 130, 246, 0.2);
          }

          .note-item.selected {
            background: rgba(59, 130, 246, 0.15);
            border-color: rgba(59, 130, 246, 0.3);
          }

          .note-title {
            color: #e5e7eb;
          }

          .reading-time {
            background: rgba(255, 255, 255, 0.08);
            color: #9ca3af;
          }

          .note-details {
            border-top-color: rgba(255, 255, 255, 0.08);
          }

          .note-summary {
            color: #9ca3af;
          }

          .note-tag {
            background: rgba(59, 130, 246, 0.15);
            color: #60a5fa;
          }

          .note-stats {
            color: #6b7280;
          }

          .more-tags {
            color: #9ca3af;
          }

          .note-rating i {
            color: #4b5563;
          }
        }

        /* 移动端适配 */
        @media (max-width: 768px) {
          .note-compact {
            padding: 6px 10px;
          }

          .note-title {
            font-size: 12px;
          }

          .reading-time {
            font-size: 10px;
            padding: 1px 4px;
          }

          .note-summary {
            font-size: 11px;
          }

          .note-stats {
            font-size: 9px;
          }

          .note-tag {
            font-size: 9px;
            padding: 1px 4px;
          }

          /* 移动端不显示悬停详情，改为点击展开 */
          .note-details {
            display: none;
          }

          .note-item.selected .note-details {
            display: block;
          }
        }

        /* 紧凑模式适配 */
        @media (max-width: 320px) {
          .note-header {
            gap: 6px;
          }

          .note-actions {
            gap: 4px;
          }

          .note-stats {
            flex-direction: column;
            gap: 2px;
            align-items: flex-start;
          }

          .note-separator {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}