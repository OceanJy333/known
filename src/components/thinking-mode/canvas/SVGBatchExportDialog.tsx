'use client'

import React, { useState, useCallback } from 'react'
import type { SVGCardNode } from '@/types/outputNode'

interface SVGBatchExportDialogProps {
  isOpen: boolean
  svgNodes: SVGCardNode[]
  onClose: () => void
}

// 导出格式
const EXPORT_FORMATS = [
  { id: 'svg', name: 'SVG', icon: 'fas fa-file-code', description: '矢量图格式，可无限缩放' },
  { id: 'png', name: 'PNG', icon: 'fas fa-file-image', description: '通用图片格式' },
  { id: 'pdf', name: 'PDF', icon: 'fas fa-file-pdf', description: '文档格式，适合打印' }
]

// 尺寸预设
const SIZE_PRESETS = [
  { id: 'original', name: '原始尺寸', width: 400, height: 600 },
  { id: 'social', name: '社交媒体', width: 1200, height: 630 },
  { id: 'instagram', name: 'Instagram', width: 1080, height: 1080 },
  { id: 'print-a4', name: 'A4打印', width: 2480, height: 3508 },
  { id: 'presentation', name: '演示文稿', width: 1920, height: 1080 }
]

// 质量选项
const QUALITY_OPTIONS = [
  { id: 'standard', name: '标准', scale: 1 },
  { id: 'high', name: '高清', scale: 2 },
  { id: 'ultra', name: '超高清', scale: 3 }
]

export function SVGBatchExportDialog({
  isOpen,
  svgNodes,
  onClose
}: SVGBatchExportDialogProps) {
  const [selectedNodes, setSelectedNodes] = useState<string[]>(svgNodes.map(n => n.id))
  const [exportFormat, setExportFormat] = useState('png')
  const [sizePreset, setSizePreset] = useState('original')
  const [quality, setQuality] = useState('high')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  // 切换节点选择
  const toggleNodeSelection = useCallback((nodeId: string) => {
    setSelectedNodes(prev => {
      if (prev.includes(nodeId)) {
        return prev.filter(id => id !== nodeId)
      } else {
        return [...prev, nodeId]
      }
    })
  }, [])

  // 全选/取消全选
  const toggleSelectAll = useCallback(() => {
    if (selectedNodes.length === svgNodes.length) {
      setSelectedNodes([])
    } else {
      setSelectedNodes(svgNodes.map(n => n.id))
    }
  }, [selectedNodes.length, svgNodes])

  // 导出单个SVG
  const exportSingleSVG = async (node: SVGCardNode, format: string, size: any, qualityScale: number) => {
    if (!node.svgContent) return null

    try {
      if (format === 'svg') {
        // SVG格式直接返回内容
        return {
          name: `${node.extractedContent?.title || 'card'}-${node.id}.svg`,
          blob: new Blob([node.svgContent], { type: 'image/svg+xml;charset=utf-8' })
        }
      } else if (format === 'png') {
        // PNG格式需要转换
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return null

        const img = new Image()
        const svgBlob = new Blob([node.svgContent], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)

        return new Promise((resolve) => {
          img.onload = () => {
            canvas.width = size.width * qualityScale
            canvas.height = size.height * qualityScale
            ctx.scale(qualityScale, qualityScale)
            ctx.drawImage(img, 0, 0, size.width, size.height)

            canvas.toBlob(blob => {
              URL.revokeObjectURL(url)
              if (blob) {
                resolve({
                  name: `${node.extractedContent?.title || 'card'}-${node.id}.png`,
                  blob
                })
              } else {
                resolve(null)
              }
            }, 'image/png')
          }

          img.onerror = () => {
            URL.revokeObjectURL(url)
            resolve(null)
          }

          img.src = url
        })
      } else if (format === 'pdf') {
        // PDF格式需要特殊处理
        // TODO: 实现PDF导出
        console.log('PDF导出功能待实现')
        return null
      }
    } catch (error) {
      console.error('导出失败:', error)
      return null
    }
  }

  // 批量导出
  const handleBatchExport = useCallback(async () => {
    setIsExporting(true)
    setExportProgress(0)

    const selectedSVGNodes = svgNodes.filter(node => selectedNodes.includes(node.id))
    const size = SIZE_PRESETS.find(s => s.id === sizePreset) || SIZE_PRESETS[0]
    const qualityScale = QUALITY_OPTIONS.find(q => q.id === quality)?.scale || 1

    const exportResults = []
    
    for (let i = 0; i < selectedSVGNodes.length; i++) {
      const node = selectedSVGNodes[i]
      const result = await exportSingleSVG(node, exportFormat, size, qualityScale)
      
      if (result) {
        exportResults.push(result)
      }
      
      setExportProgress(((i + 1) / selectedSVGNodes.length) * 100)
    }

    // 如果只有一个文件，直接下载
    if (exportResults.length === 1) {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(exportResults[0].blob)
      link.download = exportResults[0].name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else if (exportResults.length > 1) {
      // 多个文件打包成zip（需要引入zip库）
      // TODO: 实现zip打包下载
      console.log('批量下载功能待实现，当前逐个下载')
      
      // 临时方案：逐个下载
      exportResults.forEach((result, index) => {
        setTimeout(() => {
          const link = document.createElement('a')
          link.href = URL.createObjectURL(result.blob)
          link.download = result.name
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }, index * 500) // 延迟避免浏览器阻止
      })
    }

    setIsExporting(false)
    setTimeout(onClose, 1000)
  }, [svgNodes, selectedNodes, exportFormat, sizePreset, quality, onClose])

  if (!isOpen) return null

  return (
    <div className="export-dialog-overlay" onClick={onClose}>
      <div className="export-dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>批量导出SVG卡片</h2>
          <button className="close-btn" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="dialog-content">
          {/* 卡片选择 */}
          <div className="section">
            <div className="section-header">
              <h3>选择要导出的卡片</h3>
              <button className="select-all-btn" onClick={toggleSelectAll}>
                {selectedNodes.length === svgNodes.length ? '取消全选' : '全选'}
              </button>
            </div>
            <div className="cards-grid">
              {svgNodes.map(node => (
                <div
                  key={node.id}
                  className={`card-item ${selectedNodes.includes(node.id) ? 'selected' : ''}`}
                  onClick={() => toggleNodeSelection(node.id)}
                >
                  <div className="card-preview">
                    <div dangerouslySetInnerHTML={{ __html: node.svgContent }} />
                  </div>
                  <div className="card-info">
                    <h4>{node.extractedContent?.title || '未命名卡片'}</h4>
                    <p>{node.template}</p>
                  </div>
                  <div className="selection-indicator">
                    <i className={`fas ${selectedNodes.includes(node.id) ? 'fa-check-square' : 'fa-square'}`}></i>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 导出选项 */}
          <div className="section">
            <h3>导出格式</h3>
            <div className="format-options">
              {EXPORT_FORMATS.map(format => (
                <label key={format.id} className="format-option">
                  <input
                    type="radio"
                    name="format"
                    value={format.id}
                    checked={exportFormat === format.id}
                    onChange={e => setExportFormat(e.target.value)}
                  />
                  <div className="format-content">
                    <i className={format.icon}></i>
                    <div>
                      <h4>{format.name}</h4>
                      <p>{format.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 尺寸选项 */}
          <div className="section">
            <h3>尺寸预设</h3>
            <div className="size-options">
              {SIZE_PRESETS.map(preset => (
                <label key={preset.id} className="size-option">
                  <input
                    type="radio"
                    name="size"
                    value={preset.id}
                    checked={sizePreset === preset.id}
                    onChange={e => setSizePreset(e.target.value)}
                  />
                  <span>{preset.name}</span>
                  <small>{preset.width} × {preset.height}</small>
                </label>
              ))}
            </div>
          </div>

          {/* 质量选项 */}
          <div className="section">
            <h3>导出质量</h3>
            <div className="quality-options">
              {QUALITY_OPTIONS.map(option => (
                <label key={option.id} className="quality-option">
                  <input
                    type="radio"
                    name="quality"
                    value={option.id}
                    checked={quality === option.id}
                    onChange={e => setQuality(e.target.value)}
                  />
                  <span>{option.name}</span>
                  <small>{option.scale}x</small>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="dialog-footer">
          <div className="export-info">
            <span>{selectedNodes.length} 个卡片已选择</span>
          </div>
          <div className="action-buttons">
            <button className="cancel-btn" onClick={onClose}>
              取消
            </button>
            <button
              className="export-btn"
              onClick={handleBatchExport}
              disabled={selectedNodes.length === 0 || isExporting}
            >
              {isExporting ? (
                <>
                  <div className="loading-spinner"></div>
                  <span>导出中 {Math.round(exportProgress)}%</span>
                </>
              ) : (
                <>
                  <i className="fas fa-download"></i>
                  <span>开始导出</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .export-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(4px);
        }

        .export-dialog {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 800px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
        }

        .dialog-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
        }

        .dialog-header h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #111827;
        }

        .close-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .dialog-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .section {
          margin-bottom: 32px;
        }

        .section:last-child {
          margin-bottom: 0;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .select-all-btn {
          padding: 6px 12px;
          font-size: 13px;
          font-weight: 500;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          color: #374151;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .select-all-btn:hover {
          background: #e5e7eb;
          border-color: #d1d5db;
        }

        /* 卡片网格 */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }

        .card-item {
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .card-item:hover {
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .card-item.selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .card-preview {
          height: 120px;
          background: #f9fafb;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          padding: 8px;
        }

        .card-preview :global(svg) {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
        }

        .card-info {
          padding: 12px;
        }

        .card-info h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .card-info p {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
        }

        .selection-indicator {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .selection-indicator i {
          font-size: 14px;
          color: #3b82f6;
        }

        /* 格式选项 */
        .format-options {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .format-option {
          display: block;
          cursor: pointer;
        }

        .format-option input {
          display: none;
        }

        .format-content {
          padding: 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          text-align: center;
          transition: all 0.2s ease;
        }

        .format-option input:checked + .format-content {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .format-content i {
          font-size: 24px;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .format-option input:checked + .format-content i {
          color: #3b82f6;
        }

        .format-content h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .format-content p {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
        }

        /* 尺寸选项 */
        .size-options {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .size-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .size-option:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .size-option input[type="radio"]:checked + span {
          font-weight: 600;
          color: #3b82f6;
        }

        .size-option small {
          font-size: 11px;
          color: #6b7280;
        }

        /* 质量选项 */
        .quality-options {
          display: flex;
          gap: 12px;
        }

        .quality-option {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .quality-option:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .quality-option input[type="radio"]:checked + span {
          font-weight: 600;
          color: #3b82f6;
        }

        .quality-option small {
          font-size: 11px;
          color: #6b7280;
        }

        /* 底部 */
        .dialog-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .export-info {
          font-size: 14px;
          color: #6b7280;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .cancel-btn, .export-btn {
          padding: 10px 20px;
          font-size: 14px;
          font-weight: 500;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cancel-btn {
          background: transparent;
          border: 1px solid #e5e7eb;
          color: #374151;
        }

        .cancel-btn:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .export-btn {
          background: #3b82f6;
          border: none;
          color: white;
        }

        .export-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .export-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* 响应式 */
        @media (max-width: 640px) {
          .cards-grid {
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          }

          .format-options {
            grid-template-columns: 1fr;
          }

          .size-options, .quality-options {
            flex-direction: column;
          }

          .size-option, .quality-option {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}