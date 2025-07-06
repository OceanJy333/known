'use client'

import React, { useState } from 'react'
import { GroupByType } from './NotesSidebar'

interface CategoryOption {
  id: GroupByType
  label: string
  icon: string
  description: string
}

const categoryOptions: CategoryOption[] = [
  {
    id: 'tags',
    label: '按标签分类',
    icon: '🏷️',
    description: '根据笔记标签组织'
  },
  {
    id: 'time',
    label: '按时间分类',
    icon: '📅',
    description: '按创建时间分组'
  },
  {
    id: 'category',
    label: '按分类分类',
    icon: '📁',
    description: '按预设分类组织'
  }
]

interface CategorySelectorProps {
  value: GroupByType
  onChange: (value: GroupByType) => void
}

export function CategorySelector({ value, onChange }: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const currentOption = categoryOptions.find(option => option.id === value)

  const handleSelect = (optionId: GroupByType) => {
    onChange(optionId)
    setIsOpen(false)
  }

  return (
    <div className="category-selector">
      <div className="selector-header">
        <i className="fas fa-layer-group selector-header-icon"></i>
        <span className="selector-header-text">分类方式</span>
      </div>

      <div className={`selector-dropdown ${isOpen ? 'open' : ''}`}>
        <button
          className="selector-button"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="button-content">
            <span className="button-icon">{currentOption?.icon}</span>
            <span className="button-text">{currentOption?.label}</span>
          </div>
          <i className={`fas fa-chevron-down button-arrow ${isOpen ? 'rotated' : ''}`}></i>
        </button>

        {isOpen && (
          <div className="dropdown-menu">
            {categoryOptions.map((option) => (
              <button
                key={option.id}
                className={`dropdown-item ${option.id === value ? 'active' : ''}`}
                onClick={() => handleSelect(option.id)}
              >
                <div className="item-content">
                  <span className="item-icon">{option.icon}</span>
                  <div className="item-text">
                    <div className="item-label">{option.label}</div>
                    <div className="item-description">{option.description}</div>
                  </div>
                </div>
                {option.id === value && (
                  <i className="fas fa-check item-check"></i>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 点击外部关闭下拉菜单 */}
      {isOpen && (
        <div 
          className="dropdown-overlay" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <style jsx>{`
        .category-selector {
          position: relative;
        }

        .selector-header {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
          padding: 0 4px;
        }

        .selector-header-icon {
          color: #6b7280;
          margin-right: 8px;
          font-size: 14px;
        }

        .selector-header-text {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .selector-dropdown {
          position: relative;
        }

        .selector-button {
          width: 100%;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .selector-button:hover {
          border-color: rgba(59, 130, 246, 0.3);
          background: rgba(59, 130, 246, 0.02);
        }

        .selector-dropdown.open .selector-button {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .button-content {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .button-icon {
          margin-right: 8px;
          font-size: 16px;
        }

        .button-text {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .button-arrow {
          color: #6b7280;
          font-size: 12px;
          transition: transform 0.2s ease;
        }

        .button-arrow.rotated {
          transform: rotate(180deg);
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          box-shadow: 
            0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04);
          margin-top: 8px;
          z-index: 1000;
          overflow: hidden;
          animation: dropdownFadeIn 0.2s ease-out;
        }

        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .dropdown-item {
          width: 100%;
          background: transparent;
          border: none;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          cursor: pointer;
          transition: background-color 0.15s ease;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        }

        .dropdown-item:last-child {
          border-bottom: none;
        }

        .dropdown-item:hover {
          background: rgba(59, 130, 246, 0.05);
        }

        .dropdown-item.active {
          background: rgba(59, 130, 246, 0.08);
        }

        .item-content {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .item-icon {
          margin-right: 12px;
          font-size: 16px;
        }

        .item-text {
          flex: 1;
        }

        .item-label {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 2px;
        }

        .item-description {
          font-size: 12px;
          color: #6b7280;
        }

        .item-check {
          color: #3b82f6;
          font-size: 14px;
        }

        .dropdown-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999;
        }

        /* 暗色模式 */
        @media (prefers-color-scheme: dark) {
          .selector-header-icon {
            color: #9ca3af;
          }

          .selector-header-text {
            color: #e5e7eb;
          }

          .selector-button {
            background: #374151;
            border-color: rgba(255, 255, 255, 0.1);
          }

          .selector-button:hover {
            border-color: rgba(59, 130, 246, 0.5);
            background: rgba(59, 130, 246, 0.1);
          }

          .button-text {
            color: #e5e7eb;
          }

          .button-arrow {
            color: #9ca3af;
          }

          .dropdown-menu {
            background: #374151;
            border-color: rgba(255, 255, 255, 0.1);
          }

          .dropdown-item {
            border-bottom-color: rgba(255, 255, 255, 0.06);
          }

          .dropdown-item:hover {
            background: rgba(59, 130, 246, 0.15);
          }

          .dropdown-item.active {
            background: rgba(59, 130, 246, 0.2);
          }

          .item-label {
            color: #e5e7eb;
          }

          .item-description {
            color: #9ca3af;
          }
        }

        /* 移动端适配 */
        @media (max-width: 768px) {
          .selector-button {
            padding: 10px 14px;
          }

          .button-text,
          .item-label {
            font-size: 13px;
          }

          .item-description {
            font-size: 11px;
          }

          .dropdown-item {
            padding: 10px 14px;
          }
        }
      `}</style>
    </div>
  )
}