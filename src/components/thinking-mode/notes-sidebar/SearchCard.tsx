'use client'

import React, { useState, useRef, useEffect } from 'react'

interface SearchCardProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
}

export function SearchCard({ value, onChange, onClear }: SearchCardProps) {
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  // 处理清空
  const handleClear = () => {
    onClear()
    inputRef.current?.focus()
  }

  return (
    <div className={`search-card ${isFocused ? 'focused' : ''} ${value ? 'has-value' : ''}`}>
      <div className="search-input-wrapper">
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
            <span>×</span>
          </button>
        )}
      </div>

      <style jsx>{`
        .search-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: border-color 0.2s ease;
        }


        .search-card.focused {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
        }


        .search-card {
          padding: 8px 12px;
        }

        .search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }


        .search-input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          padding: 4px 7px;
          font-size: 13px;
          color: #1f2937;
          border-radius: 10px;
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
          right: 3px;
          width: 14px;
          height: 14px;
          background: rgba(107, 114, 128, 0.1);
          border: none;
          border-radius: 50%;
          color: rgba(107, 114, 128, 0.8);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-size: 7px;
        }

        .clear-button:hover {
          background: rgba(107, 114, 128, 0.2);
          color: #374151;
        }




        /* 移动端适配 */
        @media (max-width: 768px) {
          .search-card {
            padding: 5px 7px;
          }

          .search-input {
            font-size: 16px; /* 防止iOS放大 */
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