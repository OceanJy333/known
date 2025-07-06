'use client'

import React, { useEffect, useState } from 'react'
import { KnowledgeNote } from '@/types/knowledge'
import { Position } from '@/types/canvas'
import { mockTags } from '@/data/mockKnowledge'

interface HoverPreviewProps {
  note: KnowledgeNote
  position: Position
  isVisible: boolean
  onClose: () => void
}

export function HoverPreview({ note, position, isVisible, onClose }: HoverPreviewProps) {
  const [actualPosition, setActualPosition] = useState(position)

  // 获取标签信息
  const tags = note.tags
    .map(tagId => mockTags.find(tag => tag.id === tagId))
    .filter(Boolean)
    .slice(0, 5)

  // 智能定位，避开屏幕边缘
  useEffect(() => {
    if (!isVisible) return

    const previewWidth = 400
    const previewHeight = 500
    const padding = 20

    let x = position.x
    let y = position.y

    // 检查右边界
    if (x + previewWidth + padding > window.innerWidth) {
      x = position.x - previewWidth - 20
    }

    // 检查底部边界
    if (y + previewHeight + padding > window.innerHeight) {
      y = window.innerHeight - previewHeight - padding
    }

    // 检查顶部边界
    if (y < padding) {
      y = padding
    }

    // 检查左边界
    if (x < padding) {
      x = padding
    }

    setActualPosition({ x, y })
  }, [position, isVisible])

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date))
  }

  // 提取关键要点
  const extractKeyPoints = (content: string) => {
    const lines = content.split('\n')
    const points = []
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || 
          trimmed.startsWith('* ') || trimmed.match(/^\d+\./)) {
        points.push(trimmed.replace(/^[-•*]\s*|\d+\.\s*/, ''))
        if (points.length >= 4) break
      }
    }
    
    return points
  }

  const keyPoints = extractKeyPoints(note.content)

  if (!isVisible) return null

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="preview-backdrop"
        onClick={onClose}
      />
      
      {/* 预览内容 */}
      <div
        className="hover-preview"
        style={{
          left: actualPosition.x,
          top: actualPosition.y
        }}
      >
        {/* 头部 */}
        <div className="preview-header">
          <div className="preview-icon">📄</div>
          <div className="preview-title-area">
            <h3 className="preview-title">{note.title}</h3>
            <div className="preview-meta">
              <span>{formatDate(note.createdAt)}</span>
              <span>•</span>
              <span>{note.wordCount}字</span>
              <span>•</span>
              <span>{note.readingTime}分钟阅读</span>
            </div>
          </div>
          <button className="preview-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* 摘要 */}
        <div className="preview-section">
          <h4 className="section-title">摘要</h4>
          <p className="preview-summary">{note.summary}</p>
        </div>

        {/* 关键要点 */}
        {keyPoints.length > 0 && (
          <div className="preview-section">
            <h4 className="section-title">关键要点</h4>
            <ul className="key-points">
              {keyPoints.map((point, index) => (
                <li key={index} className="key-point">
                  <i className="fas fa-check-circle"></i>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 标签 */}
        {tags.length > 0 && (
          <div className="preview-section">
            <h4 className="section-title">标签</h4>
            <div className="preview-tags">
              {tags.map(tag => (
                <span 
                  key={tag!.id} 
                  className="preview-tag"
                  style={{ borderColor: tag!.color, color: tag!.color }}
                >
                  {tag!.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 统计信息 */}
        <div className="preview-section">
          <div className="preview-stats">
            <div className="stat-item">
              <i className="fas fa-eye"></i>
              <span>访问 {note.accessCount} 次</span>
            </div>
            {note.rating && (
              <div className="stat-item">
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
            {note.isFavorite && (
              <div className="stat-item favorite">
                <i className="fas fa-heart"></i>
                <span>已收藏</span>
              </div>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="preview-actions">
          <button className="action-btn primary">
            <i className="fas fa-external-link-alt"></i>
            打开详情
          </button>
          <button className="action-btn">
            <i className="fas fa-edit"></i>
            编辑
          </button>
        </div>
      </div>

      <style jsx>{`
        .preview-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.1);
          backdrop-filter: blur(2px);
          z-index: 999;
        }

        .hover-preview {
          position: fixed;
          width: 400px;
          max-height: 500px;
          background: white;
          border-radius: 16px;
          box-shadow: 
            0 20px 64px rgba(0, 0, 0, 0.15),
            0 0 0 1px rgba(0, 0, 0, 0.05);
          z-index: 1000;
          overflow-y: auto;
          animation: previewFadeIn 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes previewFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .preview-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 20px 20px 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .preview-icon {
          font-size: 20px;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .preview-title-area {
          flex: 1;
          min-width: 0;
        }

        .preview-title {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 4px;
          line-height: 1.3;
        }

        .preview-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #6b7280;
        }

        .preview-close {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .preview-close:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
        }

        .preview-section {
          padding: 16px 20px;
        }

        .preview-section:not(:last-child) {
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        }

        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin: 0 0 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .preview-summary {
          font-size: 14px;
          color: #4b5563;
          line-height: 1.6;
          margin: 0;
        }

        .key-points {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .key-point {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          font-size: 13px;
          color: #4b5563;
          line-height: 1.4;
        }

        .key-point i {
          color: #10b981;
          font-size: 11px;
          margin-top: 2px;
          flex-shrink: 0;
        }

        .preview-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .preview-tag {
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid;
          white-space: nowrap;
          background: rgba(59, 130, 246, 0.05);
        }

        .preview-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #6b7280;
        }

        .stat-item i {
          font-size: 11px;
        }

        .stat-item.favorite {
          color: #f59e0b;
        }

        .rating {
          display: flex;
          gap: 2px;
        }

        .rating i {
          font-size: 10px;
          color: #d1d5db;
        }

        .rating i.filled {
          color: #f59e0b;
        }

        .preview-actions {
          display: flex;
          gap: 8px;
          padding: 16px 20px;
          background: rgba(0, 0, 0, 0.02);
          border-radius: 0 0 16px 16px;
        }

        .action-btn {
          flex: 1;
          height: 36px;
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
          gap: 6px;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .action-btn.primary {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .action-btn.primary:hover {
          background: #2563eb;
          border-color: #2563eb;
        }

        /* 滚动条样式 */
        .hover-preview::-webkit-scrollbar {
          width: 6px;
        }

        .hover-preview::-webkit-scrollbar-track {
          background: transparent;
        }

        .hover-preview::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }

        .hover-preview::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        /* 暗色模式 */
        @media (prefers-color-scheme: dark) {
          .hover-preview {
            background: #1f2937;
            box-shadow: 
              0 20px 64px rgba(0, 0, 0, 0.3),
              0 0 0 1px rgba(255, 255, 255, 0.1);
          }

          .preview-header {
            border-bottom-color: rgba(255, 255, 255, 0.08);
          }

          .preview-title {
            color: #f3f4f6;
          }

          .preview-meta {
            color: #9ca3af;
          }

          .section-title {
            color: #e5e7eb;
          }

          .preview-summary {
            color: #d1d5db;
          }

          .key-point {
            color: #d1d5db;
          }

          .preview-section:not(:last-child) {
            border-bottom-color: rgba(255, 255, 255, 0.04);
          }

          .preview-actions {
            background: rgba(255, 255, 255, 0.02);
          }

          .action-btn {
            background: #374151;
            border-color: #4b5563;
            color: #e5e7eb;
          }

          .action-btn:hover {
            background: #4b5563;
            border-color: #6b7280;
          }
        }
      `}</style>
    </>
  )
}