'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { BaseOutputNode } from './BaseOutputNode'
import { SVGCardQuickAdjustPanel } from './SVGCardQuickAdjustPanel'
import type { SVGCardNode } from '@/types/outputNode'
import { Position } from '@/types/canvas'
import { SVG_TEMPLATES } from '@/constants/svgTemplates'

export interface SVGCardOutputNodeProps {
  node: SVGCardNode
  isActive?: boolean
  onPositionChange?: (position: Position) => void
  onRemove?: () => void
  onCardDrop?: (cardIds: string[]) => void
  onTemplateChange?: (template: string) => void
  onRegenerate?: () => void
}

export function SVGCardOutputNode({
  node,
  isActive = false,
  onPositionChange,
  onRemove,
  onCardDrop,
  onTemplateChange,
  onRegenerate
}: SVGCardOutputNodeProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const [currentColor, setCurrentColor] = useState('blue')
  const svgRef = useRef<HTMLDivElement>(null)

  // 处理拖拽进入
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setDragCounter(prev => prev + 1)
    if (!isDragOver) {
      setIsDragOver(true)
    }
  }, [isDragOver])

  // 处理拖拽悬停
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  // 处理拖拽离开
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setDragCounter(prev => {
      const newCount = prev - 1
      if (newCount <= 0) {
        setIsDragOver(false)
        return 0
      }
      return newCount
    })
  }, [])

  // 处理放置
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsDragOver(false)
    setDragCounter(0)

    try {
      // 处理知识卡片拖拽
      const noteData = e.dataTransfer.getData('application/x-knowledge-note')
      if (noteData && onCardDrop) {
        const note = JSON.parse(noteData)
        onCardDrop([note.id])
        return
      }

      // 处理旧版本拖拽格式
      const legacyData = e.dataTransfer.getData('application/json')
      if (legacyData && onCardDrop) {
        const dragData = JSON.parse(legacyData)
        if (dragData.type === 'note' && dragData.noteId) {
          onCardDrop([dragData.noteId])
          return
        }
      }
    } catch (error) {
      console.error('处理卡片拖拽失败:', error)
    }
  }, [onCardDrop])

  // 模板切换处理
  const handleTemplateChange = useCallback((templateId: string) => {
    if (onTemplateChange && templateId !== node.template) {
      onTemplateChange(templateId)
    }
  }, [node.template, onTemplateChange])
  
  // 色彩切换处理
  const handleColorChange = useCallback((colorId: string) => {
    setCurrentColor(colorId)
    // 如果有生成内容，触发重新生成以应用新色彩
    if (node.svgContent && onRegenerate) {
      onRegenerate()
    }
  }, [node.svgContent, onRegenerate])
  
  // 布局调整处理
  const handleLayoutAdjust = useCallback(() => {
    // TODO: 实现布局调整功能
    console.log('布局调整功能待实现')
  }, [])
  
  // 内容编辑处理
  const handleContentEdit = useCallback(() => {
    // TODO: 实现内容编辑功能
    console.log('内容编辑功能待实现')
  }, [])

  // 导出SVG
  const handleExportSVG = useCallback(() => {
    if (!node.svgContent) return
    
    try {
      const blob = new Blob([node.svgContent], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `knowledge-card-${Date.now()}.svg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('导出SVG失败:', error)
    }
  }, [node.svgContent])

  // 导出PNG
  const handleExportPNG = useCallback(async () => {
    if (!node.svgContent) return
    
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const img = new Image()
      const svgBlob = new Blob([node.svgContent], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      
      img.onload = () => {
        // 2x分辨率
        canvas.width = img.width * 2
        canvas.height = img.height * 2
        ctx.scale(2, 2)
        ctx.drawImage(img, 0, 0)
        
        canvas.toBlob(blob => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = `knowledge-card-${Date.now()}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(downloadUrl)
          }
        }, 'image/png')
        
        URL.revokeObjectURL(url)
      }
      
      img.onerror = () => {
        console.error('SVG转PNG失败')
        URL.revokeObjectURL(url)
      }
      
      img.src = url
    } catch (error) {
      console.error('导出PNG失败:', error)
    }
  }, [node.svgContent])

  // 状态指示器
  const getStatusContent = () => {
    switch (node.status) {
      case 'extracting':
        return (
          <div className="status-indicator extracting">
            <div className="loading-spinner"></div>
            <span>正在分析内容...</span>
          </div>
        )
      case 'generating':
        return (
          <div className="status-indicator generating">
            <div className="loading-spinner"></div>
            <span>正在生成卡片...</span>
          </div>
        )
      case 'error':
        return (
          <div className="status-indicator error">
            <i className="fas fa-exclamation-triangle"></i>
            <span>生成失败，请重试</span>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      <BaseOutputNode
        node={node}
        isActive={isActive}
        onPositionChange={onPositionChange}
        onRemove={onRemove}
      >
        <div 
          className={`svg-card-content ${isDragOver ? 'drag-over' : ''}`}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* 空状态 */}
          {!node.svgContent && node.status === 'idle' && (
            <div className="empty-state">
              <div className="drop-zone">
                <div className="drop-icon">
                  <i className="fas fa-file-image"></i>
                </div>
                <div className="drop-text">
                  <h3>拖拽知识卡片到这里</h3>
                  <p>生成精美的知识卡片</p>
                </div>
              </div>
            </div>
          )}

          {/* 状态指示器 */}
          {getStatusContent()}

          {/* SVG预览区 */}
          {node.svgContent && (
            <div className="svg-preview" ref={svgRef}>
              <div 
                className="svg-container"
                dangerouslySetInnerHTML={{ __html: node.svgContent }}
              />
            </div>
          )}

          {/* 快速调整面板 */}
          {(node.svgContent || node.status !== 'idle') && (
            <SVGCardQuickAdjustPanel
              currentTemplate={node.template}
              currentColor={currentColor}
              onTemplateChange={handleTemplateChange}
              onColorChange={handleColorChange}
              onLayoutAdjust={handleLayoutAdjust}
              onContentEdit={handleContentEdit}
              disabled={node.status === 'generating' || node.status === 'extracting'}
            />
          )}

          {/* 操作栏 */}
          {node.svgContent && (
            <div className="action-bar">
              <button
                className="action-btn regenerate-btn"
                onClick={onRegenerate}
                disabled={node.status === 'generating' || node.status === 'extracting'}
                title="重新生成"
              >
                <i className="fas fa-redo"></i>
                <span>重新生成</span>
              </button>
              <button
                className="action-btn export-btn"
                onClick={handleExportSVG}
                title="导出SVG"
              >
                <i className="fas fa-download"></i>
                <span>导出SVG</span>
              </button>
              <button
                className="action-btn export-btn"
                onClick={handleExportPNG}
                title="导出图片"
              >
                <i className="fas fa-image"></i>
                <span>导出图片</span>
              </button>
            </div>
          )}

          {/* 拖拽覆盖层 */}
          {isDragOver && (
            <div className="drag-overlay">
              <div className="drag-overlay-content">
                <i className="fas fa-plus-circle"></i>
                <span>松开以添加知识卡片</span>
              </div>
            </div>
          )}
        </div>
      </BaseOutputNode>

      <style jsx>{`
        .svg-card-content {
          min-height: 200px;
          max-height: 800px;
          overflow: hidden;
          position: relative;
          background: #fafafa;
          border-radius: 0 0 16px 16px;
        }

        .svg-card-content.drag-over {
          background: rgba(59, 130, 246, 0.05);
        }

        /* 空状态 */
        .empty-state {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 240px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }

        .drop-zone {
          text-align: center;
          padding: 40px 20px;
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.8);
          transition: all 0.3s ease;
        }

        .svg-card-content:hover .drop-zone {
          border-color: #3b82f6;
          background: rgba(59, 130, 246, 0.02);
        }

        .drop-icon {
          font-size: 48px;
          color: #94a3b8;
          margin-bottom: 16px;
        }

        .drop-text h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .drop-text p {
          margin: 0;
          font-size: 14px;
          color: #6b7280;
        }

        /* 状态指示器 */
        .status-indicator {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          height: 240px;
          background: #ffffff;
          font-size: 14px;
          color: #6b7280;
        }

        .status-indicator.error {
          color: #ef4444;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid #e5e7eb;
          border-top: 2px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* SVG预览区 */
        .svg-preview {
          background: #ffffff;
          padding: 20px;
          display: flex;
          justify-content: center;
          max-height: 600px;
          overflow: auto;
        }

        .svg-container {
          max-width: 100%;
          max-height: 100%;
        }

        .svg-container :global(svg) {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }


        /* 操作栏 */
        .action-bar {
          display: flex;
          gap: 8px;
          padding: 16px 20px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }

        .action-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 500;
          background: #ffffff;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .action-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .regenerate-btn:hover:not(:disabled) {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .export-btn:hover:not(:disabled) {
          border-color: #059669;
          color: #059669;
        }

        /* 拖拽覆盖层 */
        .drag-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(59, 130, 246, 0.1);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .drag-overlay-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 32px;
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          border: 2px dashed #3b82f6;
          color: #3b82f6;
          font-weight: 600;
        }

        .drag-overlay-content i {
          font-size: 32px;
        }

        /* 响应式适配 */
        @media (max-width: 480px) {
          .action-bar {
            gap: 4px;
            padding: 12px 16px;
          }
          
          .action-btn {
            padding: 6px 8px;
            font-size: 12px;
          }
          
          .action-btn span {
            display: none;
          }
        }
      `}</style>
    </>
  )
}