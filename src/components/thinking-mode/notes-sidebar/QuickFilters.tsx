'use client'

import React from 'react'
import { QuickFilterType } from './NotesSidebar'

interface FilterOption {
  id: QuickFilterType
  label: string
  icon: string
  description: string
}

const filterOptions: FilterOption[] = [
  {
    id: 'favorite',
    label: '收藏',
    icon: '⭐',
    description: '已收藏的笔记'
  },
  {
    id: 'recent',
    label: '最近',
    icon: '🕐',
    description: '最近7天访问的笔记'
  },
  {
    id: 'trending',
    label: '热门',
    icon: '📈',
    description: '访问次数最多的笔记'
  }
]

interface QuickFiltersProps {
  activeFilters: Set<QuickFilterType>
  onToggleFilter: (filter: QuickFilterType) => void
}

export function QuickFilters({ activeFilters, onToggleFilter }: QuickFiltersProps) {
  return (
    <div className="quick-filters">
      <div className="filters-header">
        <span className="filters-title">快捷筛选</span>
      </div>
      
      <div className="filters-list">
        {filterOptions.map(option => {
          const isActive = activeFilters.has(option.id)
          
          return (
            <button
              key={option.id}
              className={`filter-button ${isActive ? 'active' : ''}`}
              onClick={() => onToggleFilter(option.id)}
              title={option.description}
            >
              <span className="filter-icon">{option.icon}</span>
              <span className="filter-label">{option.label}</span>
              {isActive && (
                <div className="active-indicator"></div>
              )}
            </button>
          )
        })}
      </div>

      <style jsx>{`
        .quick-filters {
          width: 100%;
        }

        .filters-header {
          margin-bottom: 12px;
        }

        .filters-title {
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .filters-list {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .filter-button {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 20px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 13px;
          font-weight: 500;
          color: #374151;
          min-width: 0;
          flex: 1;
          justify-content: center;
        }

        .filter-button:hover {
          border-color: rgba(59, 130, 246, 0.3);
          background: rgba(59, 130, 246, 0.02);
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
        }

        .filter-button.active {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          border-color: #3b82f6;
          color: white;
          box-shadow: 0 2px 12px rgba(59, 130, 246, 0.3);
        }

        .filter-button.active:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
        }

        .filter-icon {
          font-size: 14px;
          flex-shrink: 0;
        }

        .filter-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .active-indicator {
          position: absolute;
          top: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: #ef4444;
          border-radius: 50%;
          border: 2px solid white;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        /* 多选状态的视觉反馈 */
        .filters-list:has(.filter-button.active) .filter-button:not(.active) {
          opacity: 0.6;
        }

        .filters-list:has(.filter-button.active) .filter-button:not(.active):hover {
          opacity: 1;
        }

        /* 暗色模式 */
        @media (prefers-color-scheme: dark) {
          .filters-title {
            color: #9ca3af;
          }

          .filter-button {
            background: #374151;
            border-color: rgba(255, 255, 255, 0.1);
            color: #e5e7eb;
          }

          .filter-button:hover {
            border-color: rgba(59, 130, 246, 0.5);
            background: rgba(59, 130, 246, 0.1);
          }

          .filter-button.active {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            border-color: #3b82f6;
            color: white;
          }

          .active-indicator {
            border-color: #374151;
          }
        }

        /* 移动端适配 */
        @media (max-width: 768px) {
          .filters-list {
            gap: 6px;
          }

          .filter-button {
            padding: 6px 10px;
            font-size: 12px;
            border-radius: 16px;
          }

          .filter-icon {
            font-size: 13px;
          }

          .filters-title {
            font-size: 11px;
          }
        }

        /* 超小屏幕适配 */
        @media (max-width: 320px) {
          .filters-list {
            flex-direction: column;
            gap: 4px;
          }

          .filter-button {
            flex: none;
            justify-content: flex-start;
          }

          .filter-label {
            overflow: visible;
            white-space: normal;
          }
        }

        /* 3个按钮的响应式布局 */
        @media (min-width: 280px) and (max-width: 320px) {
          .filter-button {
            min-width: 80px;
          }
        }

        @media (min-width: 321px) and (max-width: 400px) {
          .filter-button {
            min-width: 90px;
          }
        }

        /* 确保在较宽屏幕上按钮不会过度拉伸 */
        @media (min-width: 400px) {
          .filters-list {
            justify-content: space-between;
          }
          
          .filter-button {
            flex: 0 1 auto;
            max-width: 120px;
          }
        }

        /* 聚焦状态的可访问性 */
        .filter-button:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        .filter-button.active:focus {
          box-shadow: 
            0 0 0 3px rgba(59, 130, 246, 0.2),
            0 4px 16px rgba(59, 130, 246, 0.4);
        }

        /* 按钮按下状态 */
        .filter-button:active {
          transform: translateY(0);
        }

        .filter-button.active:active {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  )
}