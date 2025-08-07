'use client'

import React, { useState } from 'react'
import { SVG_TEMPLATES } from '@/constants/svgTemplates'

interface SVGCardQuickAdjustPanelProps {
  currentTemplate: string
  currentColor?: string
  onTemplateChange: (templateId: string) => void
  onColorChange: (color: string) => void
  onLayoutAdjust?: () => void
  onContentEdit?: () => void
  disabled?: boolean
}

// 预设色彩方案
const COLOR_SCHEMES = [
  { id: 'blue', name: '蓝色', primary: '#3b82f6', secondary: '#dbeafe' },
  { id: 'green', name: '绿色', primary: '#10b981', secondary: '#d1fae5' },
  { id: 'purple', name: '紫色', primary: '#8b5cf6', secondary: '#e9d5ff' },
  { id: 'orange', name: '橙色', primary: '#f59e0b', secondary: '#fed7aa' },
  { id: 'red', name: '红色', primary: '#ef4444', secondary: '#fee2e2' },
  { id: 'gray', name: '灰色', primary: '#6b7280', secondary: '#e5e7eb' }
]

export function SVGCardQuickAdjustPanel({
  currentTemplate,
  currentColor = 'blue',
  onTemplateChange,
  onColorChange,
  onLayoutAdjust,
  onContentEdit,
  disabled = false
}: SVGCardQuickAdjustPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'template' | 'color' | 'layout'>('template')

  return (
    <div className={`quick-adjust-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* 折叠状态的简洁按钮栏 */}
      {!isExpanded && (
        <div className="collapsed-bar">
          <button
            className="expand-btn"
            onClick={() => setIsExpanded(true)}
            title="展开调整面板"
          >
            <i className="fas fa-sliders-h"></i>
            <span>快速调整</span>
          </button>
          
          {/* 快速模板切换 */}
          <div className="quick-templates">
            {SVG_TEMPLATES.slice(0, 3).map(template => (
              <button
                key={template.id}
                className={`quick-template-btn ${currentTemplate === template.id ? 'active' : ''}`}
                onClick={() => onTemplateChange(template.id)}
                disabled={disabled}
                title={template.name}
              >
                <i className={template.icon}></i>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 展开状态的完整面板 */}
      {isExpanded && (
        <div className="expanded-panel">
          {/* 面板头部 */}
          <div className="panel-header">
            <h3>快速调整</h3>
            <button
              className="collapse-btn"
              onClick={() => setIsExpanded(false)}
              title="收起面板"
            >
              <i className="fas fa-chevron-up"></i>
            </button>
          </div>

          {/* 标签页切换 */}
          <div className="tab-nav">
            <button
              className={`tab-btn ${activeTab === 'template' ? 'active' : ''}`}
              onClick={() => setActiveTab('template')}
            >
              <i className="fas fa-th-large"></i>
              模板
            </button>
            <button
              className={`tab-btn ${activeTab === 'color' ? 'active' : ''}`}
              onClick={() => setActiveTab('color')}
            >
              <i className="fas fa-palette"></i>
              色彩
            </button>
            <button
              className={`tab-btn ${activeTab === 'layout' ? 'active' : ''}`}
              onClick={() => setActiveTab('layout')}
            >
              <i className="fas fa-layer-group"></i>
              布局
            </button>
          </div>

          {/* 标签页内容 */}
          <div className="tab-content">
            {/* 模板选择 */}
            {activeTab === 'template' && (
              <div className="template-content">
                <div className="template-grid">
                  {SVG_TEMPLATES.map(template => (
                    <div
                      key={template.id}
                      className={`template-card ${currentTemplate === template.id ? 'active' : ''}`}
                      onClick={() => !disabled && onTemplateChange(template.id)}
                    >
                      <div className="template-preview">
                        <i className={template.icon}></i>
                      </div>
                      <div className="template-info">
                        <h4>{template.name}</h4>
                        <p>{template.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 色彩选择 */}
            {activeTab === 'color' && (
              <div className="color-content">
                <div className="color-grid">
                  {COLOR_SCHEMES.map(scheme => (
                    <div
                      key={scheme.id}
                      className={`color-card ${currentColor === scheme.id ? 'active' : ''}`}
                      onClick={() => !disabled && onColorChange(scheme.id)}
                    >
                      <div 
                        className="color-preview"
                        style={{ 
                          background: `linear-gradient(135deg, ${scheme.primary} 0%, ${scheme.secondary} 100%)`
                        }}
                      />
                      <span className="color-name">{scheme.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 布局调整 */}
            {activeTab === 'layout' && (
              <div className="layout-content">
                <div className="layout-actions">
                  <button
                    className="layout-btn"
                    onClick={onContentEdit}
                    disabled={disabled}
                  >
                    <i className="fas fa-edit"></i>
                    <span>编辑内容</span>
                    <small>双击文本直接编辑</small>
                  </button>
                  <button
                    className="layout-btn"
                    onClick={onLayoutAdjust}
                    disabled={disabled}
                  >
                    <i className="fas fa-expand-arrows-alt"></i>
                    <span>调整布局</span>
                    <small>拖拽调整区块大小</small>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .quick-adjust-panel {
          position: relative;
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          margin: 16px 20px;
          transition: all 0.3s ease;
          overflow: hidden;
        }

        /* 折叠状态 */
        .collapsed-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
        }

        .expand-btn {
          display: flex;
          align-items: center;
          gap: 6px;
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

        .expand-btn:hover {
          background: #e5e7eb;
          border-color: #d1d5db;
        }

        .quick-templates {
          display: flex;
          gap: 6px;
          flex: 1;
        }

        .quick-template-btn {
          width: 32px;
          height: 32px;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          background: #ffffff;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quick-template-btn:hover:not(:disabled) {
          border-color: #3b82f6;
          color: #3b82f6;
        }

        .quick-template-btn.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }

        .quick-template-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* 展开状态 */
        .expanded-panel {
          background: #ffffff;
        }

        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .collapse-btn {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          color: #6b7280;
          cursor: pointer;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .collapse-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        /* 标签页导航 */
        .tab-nav {
          display: flex;
          gap: 0;
          padding: 0 20px;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 500;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-btn:hover {
          color: #374151;
          background: #f9fafb;
        }

        .tab-btn.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }

        .tab-btn i {
          font-size: 14px;
        }

        /* 标签页内容 */
        .tab-content {
          padding: 20px;
        }

        /* 模板内容 */
        .template-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .template-card {
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .template-card:hover {
          border-color: #3b82f6;
          background: #f0f9ff;
        }

        .template-card.active {
          border-color: #3b82f6;
          background: #dbeafe;
        }

        .template-preview {
          width: 48px;
          height: 48px;
          background: #f3f4f6;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 12px;
          font-size: 24px;
          color: #6b7280;
        }

        .template-card.active .template-preview {
          background: #3b82f6;
          color: white;
        }

        .template-info h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #111827;
        }

        .template-info p {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.4;
        }

        /* 色彩内容 */
        .color-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .color-card {
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .color-preview {
          width: 100%;
          height: 60px;
          border-radius: 8px;
          margin-bottom: 8px;
          transition: all 0.2s ease;
        }

        .color-card:hover .color-preview {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .color-card.active .color-preview {
          outline: 3px solid #3b82f6;
          outline-offset: 2px;
        }

        .color-name {
          display: block;
          text-align: center;
          font-size: 12px;
          font-weight: 500;
          color: #374151;
        }

        /* 布局内容 */
        .layout-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .layout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .layout-btn:hover:not(:disabled) {
          background: #f3f4f6;
          border-color: #d1d5db;
        }

        .layout-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .layout-btn i {
          font-size: 20px;
          color: #6b7280;
          width: 24px;
        }

        .layout-btn span {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: #111827;
        }

        .layout-btn small {
          font-size: 12px;
          color: #6b7280;
          display: block;
          margin-top: 2px;
        }

        /* 响应式 */
        @media (max-width: 480px) {
          .quick-adjust-panel {
            margin: 12px 16px;
          }

          .template-grid {
            grid-template-columns: 1fr;
          }

          .color-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  )
}