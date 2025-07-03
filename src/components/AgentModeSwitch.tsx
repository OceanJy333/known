'use client'

import { useState, useEffect } from 'react'

export type AgentMode = 'ask' | 'agent'

interface AgentModeSwitchProps {
  mode: AgentMode
  onModeChange: (mode: AgentMode) => void
  disabled?: boolean
  className?: string
}

export default function AgentModeSwitch({ 
  mode, 
  onModeChange, 
  disabled = false,
  className = '' 
}: AgentModeSwitchProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  // 切换模式
  const handleToggle = () => {
    if (disabled) return
    
    setIsAnimating(true)
    const newMode: AgentMode = mode === 'ask' ? 'agent' : 'ask'
    onModeChange(newMode)
    
    // 动画结束后重置状态
    setTimeout(() => setIsAnimating(false), 300)
  }

  // 键盘快捷键支持 (可选)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return
      
      // Alt + M 切换模式
      if (e.altKey && e.key === 'm') {
        e.preventDefault()
        handleToggle()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mode, disabled])

  // 检查是否为紧凑模式（通过 className 判断）
  const isCompact = className.includes('h-8') || className.includes('text-xs')
  
  return (
    <div className={`flex items-center ${className}`}>
      <div 
        className={`
          relative flex items-center rounded-full p-0.5 transition-all duration-300 cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
          ${mode === 'ask' 
            ? 'bg-blue-100 dark:bg-blue-900/30' 
            : 'bg-green-100 dark:bg-green-900/30'
          }
          ${isCompact ? 'h-8' : ''}
        `}
        onClick={handleToggle}
        title={disabled ? '等待 AI 完成响应' : `当前模式: ${mode === 'ask' ? 'Ask' : 'Agent'} (Alt+M 切换)`}
      >
        {/* 背景滑块 */}
        <div 
          className={`
            absolute rounded-full transition-all duration-300 ease-out
            ${isCompact 
              ? 'w-10 h-7 translate-x-0' + (mode === 'agent' ? ' translate-x-12' : '')
              : 'w-12 h-6 translate-x-0' + (mode === 'agent' ? ' translate-x-16' : '')
            }
            ${mode === 'ask' 
              ? 'bg-blue-500 dark:bg-blue-400' 
              : 'bg-green-500 dark:bg-green-400'
            }
            ${isAnimating ? 'scale-110' : 'scale-100'}
          `} 
        />
        
        {/* Ask 模式按钮 */}
        <div 
          className={`
            relative z-10 flex items-center rounded-full transition-all duration-300
            ${isCompact 
              ? 'space-x-1 px-2 py-1.5' 
              : 'space-x-1.5 px-3 py-1.5'
            }
            ${mode === 'ask' 
              ? 'text-white' 
              : 'text-gray-600 dark:text-gray-400'
            }
          `}
        >
          <i className={`fas fa-question-circle transition-transform duration-300 ${
            isCompact ? 'text-xs' : 'text-sm'
          } ${isAnimating && mode === 'ask' ? 'scale-125' : ''}`} />
          <span className={`font-medium ${isCompact ? 'text-xs' : 'text-xs'}`}>Ask</span>
        </div>
        
        {/* Agent 模式按钮 */}
        <div 
          className={`
            relative z-10 flex items-center rounded-full transition-all duration-300
            ${isCompact 
              ? 'space-x-1 px-2 py-1.5' 
              : 'space-x-1.5 px-3 py-1.5'
            }
            ${mode === 'agent' 
              ? 'text-white' 
              : 'text-gray-600 dark:text-gray-400'
            }
          `}
        >
          <i className={`fas fa-magic transition-transform duration-300 ${
            isCompact ? 'text-xs' : 'text-sm'
          } ${isAnimating && mode === 'agent' ? 'scale-125' : ''}`} />
          <span className={`font-medium ${isCompact ? 'text-xs' : 'text-xs'}`}>Agent</span>
        </div>
      </div>
      
      {/* 模式说明（仅在非紧凑模式下显示） */}
      {!disabled && !isCompact && (
        <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">
          {mode === 'ask' ? '问答模式' : '智能笔记'}
        </div>
      )}
    </div>
  )
}