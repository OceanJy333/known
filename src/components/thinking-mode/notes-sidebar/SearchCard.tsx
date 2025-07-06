'use client'

import React, { useState, useRef, useEffect } from 'react'

interface SearchCardProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
}

export function SearchCard({ value, onChange, onClear }: SearchCardProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsExpanded(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 处理输入变化（带防抖）
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  // 处理清空
  const handleClear = () => {
    onClear()
    inputRef.current?.focus()
  }

  // 处理展开/折叠切换
  const toggleExpanded = () => {
    if (!isExpanded) {
      setIsExpanded(true)
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }

  return (
    <div className={`search-card ${isExpanded ? 'expanded' : 'collapsed'} ${isFocused ? 'focused' : ''} ${value ? 'has-value' : ''}`}>
      {isExpanded ? (
        // 展开状态
        <div className="search-expanded">
          <div className="search-input-wrapper">
            <div className="search-icon">
              <i className="fas fa-search"></i>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleInputChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="搜索笔记..."
              className="search-input"
            />
            {value && (
              <button
                onClick={handleClear}
                className="clear-button"
                title="清空搜索"
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          <div className="search-tips">
            💡 试试: #标签 或 "关键词"
          </div>
        </div>
      ) : (
        // 折叠状态
        <div className="search-collapsed" onClick={toggleExpanded}>
          <div className="collapsed-icon">
            <i className="fas fa-search"></i>
          </div>
        </div>
      )}

      <style jsx>{`
        .search-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(32px) saturate(150%);
          -webkit-backdrop-filter: blur(32px) saturate(150%);
          border: 0.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 24px 64px rgba(0, 0, 0, 0.03),
            0 12px 32px rgba(0, 0, 0, 0.02),
            0 6px 16px rgba(0, 0, 0, 0.01),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        .search-card:hover {
          transform: translateY(-2px);
          box-shadow: 
            0 32px 72px rgba(0, 0, 0, 0.04),
            0 16px 40px rgba(0, 0, 0, 0.03),
            0 8px 20px rgba(0, 0, 0, 0.02);
        }

        .search-card.focused {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 
            0 0 0 3px rgba(59, 130, 246, 0.1),
            0 32px 72px rgba(0, 0, 0, 0.04),
            0 16px 40px rgba(0, 0, 0, 0.03),
            0 8px 20px rgba(0, 0, 0, 0.02);
        }

        .search-card.has-value {
          background: rgba(255, 255, 255, 0.08);
        }

        .search-card.collapsed {
          width: 56px;
          height: 56px;
          padding: 16px;
          margin-left: 8px;
          cursor: pointer;
          border-radius: 28px;
        }

        .search-card.expanded {
          padding: 20px;
        }

        .search-expanded {
          width: 100%;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: rgba(107, 114, 128, 0.6);
          z-index: 1;
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          padding: 12px 16px 12px 40px;
          font-size: 14px;
          color: #1f2937;
          border-radius: 12px;
          transition: background-color 0.2s ease;
        }

        .search-input::placeholder {
          color: rgba(107, 114, 128, 0.6);
        }

        .search-input:focus {
          background: rgba(255, 255, 255, 0.1);
        }

        .clear-button {
          position: absolute;
          right: 8px;
          width: 24px;
          height: 24px;
          background: rgba(107, 114, 128, 0.1);
          border: none;
          border-radius: 50%;
          color: rgba(107, 114, 128, 0.8);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .clear-button:hover {
          background: rgba(107, 114, 128, 0.2);
          color: #374151;
        }

        .search-tips {
          margin-top: 8px;
          font-size: 12px;
          color: rgba(107, 114, 128, 0.7);
          text-align: center;
        }

        .search-collapsed {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .collapsed-icon {
          color: rgba(107, 114, 128, 0.8);
          font-size: 18px;
        }

        /* 动画效果 */
        @keyframes searchCardFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .search-card {
          animation: searchCardFadeIn 0.3s ease-out;
        }

        /* 移动端适配 */
        @media (max-width: 768px) {
          .search-card.collapsed {
            width: 48px;
            height: 48px;
            padding: 12px;
          }

          .search-card.expanded {
            padding: 16px;
          }

          .search-input {
            font-size: 16px; /* 防止iOS放大 */
          }

          .search-tips {
            font-size: 11px;
          }
        }

        /* 暗色模式支持 */
        @media (prefers-color-scheme: dark) {
          .search-card {
            background: rgba(0, 0, 0, 0.15);
            border-color: rgba(255, 255, 255, 0.1);
          }

          .search-card.focused {
            background: rgba(0, 0, 0, 0.2);
          }

          .search-card.has-value {
            background: rgba(0, 0, 0, 0.25);
          }

          .search-input {
            color: #f9fafb;
          }

          .search-input::placeholder {
            color: rgba(156, 163, 175, 0.6);
          }

          .search-tips {
            color: rgba(156, 163, 175, 0.7);
          }

          .search-icon,
          .collapsed-icon {
            color: rgba(156, 163, 175, 0.8);
          }

          .clear-button {
            background: rgba(156, 163, 175, 0.1);
            color: rgba(156, 163, 175, 0.8);
          }

          .clear-button:hover {
            background: rgba(156, 163, 175, 0.2);
            color: #d1d5db;
          }
        }
      `}</style>
    </div>
  )
}