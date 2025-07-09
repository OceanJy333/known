'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { KnowledgeNote } from '@/types/knowledge'
import { Position } from '@/types/canvas'

interface CanvasAIInputProps {
  onQuestionSubmit: (question: string, inputPosition?: Position) => void
  isLoading?: boolean
  isVisible?: boolean
  onClose?: () => void
  placeholder?: string
  knowledgeBase?: KnowledgeNote[]
  position?: Position
}


interface AIProcessingState {
  stage: 'idle' | 'analyzing' | 'searching' | 'generating' | 'complete'
  message: string
  progress: number
}

export function CanvasAIInput({
  onQuestionSubmit,
  isLoading = false,
  isVisible = true,
  onClose,
  placeholder = "问一个问题，让AI为你召回相关的知识卡片...",
  knowledgeBase = [],
  position = { x: 400, y: 300 }
}: CanvasAIInputProps) {
  const [question, setQuestion] = useState('')
  const [processingState, setProcessingState] = useState<AIProcessingState>({
    stage: 'idle',
    message: '',
    progress: 0
  })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 使用传入的position或默认位置
  const containerPosition = position

  // 建议问题列表
  const suggestionQuestions = [
    "如何进行有效的用户调研？",
    "AI产品设计的核心原则有哪些？",
    "如何发掘用户的真实需求？",
    "产品迭代的最佳实践是什么？",
    "用户体验设计的基本流程",
    "数据驱动的产品决策方法"
  ]

  // 模拟AI处理状态更新
  useEffect(() => {
    if (isLoading) {
      const stages: Array<{ stage: AIProcessingState['stage'], message: string, duration: number }> = [
        { stage: 'analyzing', message: '正在分析您的问题...', duration: 1000 },
        { stage: 'searching', message: '正在搜索相关知识卡片...', duration: 1500 },
        { stage: 'generating', message: '正在生成智能回答...', duration: 2000 },
        { stage: 'complete', message: '处理完成！', duration: 500 }
      ]

      let currentStage = 0
      let progress = 0

      const updateStage = () => {
        if (currentStage < stages.length) {
          const stage = stages[currentStage]
          setProcessingState({
            stage: stage.stage,
            message: stage.message,
            progress: ((currentStage + 1) / stages.length) * 100
          })

          currentStage++
          setTimeout(updateStage, stage.duration)
        }
      }

      updateStage()
    } else {
      setProcessingState({
        stage: 'idle',
        message: '',
        progress: 0
      })
    }
  }, [isLoading])

  // 自动聚焦
  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 300)
    }
  }, [isVisible])

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setQuestion(value)
    
    // 自动调整文本框高度
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
    }

    // 控制展开状态
    setIsExpanded(value.length > 20 || value.includes('\n'))
  }

  // 获取输入框在画布中的位置
  const getInputPosition = useCallback((): Position => {
    if (!containerRef.current) {
      return { x: 400, y: 300 } // 默认中心位置
    }
    
    // 获取输入框容器相对于画布的位置
    const rect = containerRef.current.getBoundingClientRect()
    const canvasElement = containerRef.current.closest('.canvas-area')
    const canvasRect = canvasElement?.getBoundingClientRect()
    
    if (!canvasRect) {
      return { x: 400, y: 300 }
    }
    
    // 计算输入框中心点相对于画布的位置
    const centerX = rect.left - canvasRect.left + rect.width / 2
    const centerY = rect.top - canvasRect.top + rect.height / 2
    
    return { x: centerX, y: centerY }
  }, [])

  // 处理提交
  const handleSubmit = useCallback((questionToSubmit?: string) => {
    const finalQuestion = questionToSubmit || question.trim()
    
    if (!finalQuestion || isLoading) return

    console.log('📝 用户提交问题:', finalQuestion)
    
    // 获取输入框位置
    const inputPosition = getInputPosition()
    console.log('📍 输入框位置:', inputPosition)
    
    setShowSuggestions(false)
    onQuestionSubmit(finalQuestion, inputPosition)
    
    // 如果是用户输入的问题，清空输入框
    if (!questionToSubmit) {
      setQuestion('')
      setIsExpanded(false)
    }
  }, [question, isLoading, onQuestionSubmit, getInputPosition])

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
    
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      if (question.trim() === '' && onClose) {
        onClose()
      }
    }
  }

  // 处理建议问题点击
  const handleSuggestionClick = (suggestion: string) => {
    setQuestion(suggestion)
    setIsExpanded(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.setSelectionRange(suggestion.length, suggestion.length)
    }, 100)
  }

  // 处理快速提交建议
  const handleSuggestionSubmit = (suggestion: string) => {
    handleSubmit(suggestion)
  }

  if (!isVisible) return null

  return (
    <div
      ref={containerRef}
      className={`canvas-ai-input-container ${isExpanded ? 'expanded' : ''} ${isLoading ? 'loading' : ''}`}
      style={{
        position: 'absolute',
        left: `${containerPosition.x}px`,
        top: `${containerPosition.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* 主输入区域 */}
      <div className="ai-input-card">
        {/* AI头像和状态指示器 */}
        <div className="ai-avatar-section">
          <div className="ai-avatar">
            <div className={`ai-status-indicator ${processingState.stage}`}>
              <i className="fas fa-robot"></i>
            </div>
            {isLoading && (
              <div className="processing-ring">
                <svg className="processing-circle" viewBox="0 0 32 32">
                  <circle
                    cx="16"
                    cy="16"
                    r="14"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray={`${processingState.progress * 0.88} 88`}
                    transform="rotate(-90 16 16)"
                  />
                </svg>
              </div>
            )}
          </div>
          
          {/* 处理状态消息 */}
          {isLoading && (
            <div className="processing-message">
              <span className="processing-text">{processingState.message}</span>
              <div className="processing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </div>

        {/* 输入区域 */}
        <div className="input-section">
          <textarea
            ref={inputRef}
            value={question}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            placeholder={placeholder}
            className="ai-input-textarea"
            disabled={isLoading}
            rows={1}
          />
          
          {/* 输入控制按钮 */}
          <div className="input-controls">
            {question.trim() && !isLoading && (
              <button
                onClick={() => handleSubmit()}
                className="submit-button"
                title="提交问题 (Enter)"
              >
                <i className="fas fa-paper-plane"></i>
              </button>
            )}
            
            {isLoading && (
              <button
                onClick={() => {/* TODO: 实现停止功能 */}}
                className="stop-button"
                title="停止处理"
              >
                <i className="fas fa-stop"></i>
              </button>
            )}
            
            {!isLoading && (
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className={`suggestions-button ${showSuggestions ? 'active' : ''}`}
                title="显示建议问题"
              >
                <i className="fas fa-lightbulb"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 建议问题区域 */}
      {showSuggestions && !isLoading && (
        <div className="suggestions-panel">
          <div className="suggestions-header">
            <span className="suggestions-title">
              <i className="fas fa-lightbulb"></i>
              试试这些问题
            </span>
            <button
              onClick={() => setShowSuggestions(false)}
              className="close-suggestions"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="suggestions-grid">
            {suggestionQuestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="suggestion-content">
                  <span className="suggestion-text">{suggestion}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSuggestionSubmit(suggestion)
                    }}
                    className="suggestion-submit"
                    title="直接提交此问题"
                  >
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* 知识库状态 */}
          {knowledgeBase.length > 0 && (
            <div className="knowledge-base-status">
              <i className="fas fa-database"></i>
              <span>当前知识库包含 {knowledgeBase.length} 条笔记</span>
            </div>
          )}
        </div>
      )}

      {/* 样式定义 */}
      <style jsx>{`
        .canvas-ai-input-container {
          z-index: 100;
          max-width: 600px;
          width: 520px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .canvas-ai-input-container.expanded {
          transform: translate(-50%, -60%);
        }

        .canvas-ai-input-container.loading {
          pointer-events: none;
          animation: transformToNode 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        .ai-input-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 24px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.1),
            0 8px 16px rgba(0, 0, 0, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          padding: 24px;
          display: flex;
          gap: 16px;
          align-items: flex-start;
          transition: all 0.3s ease;
        }

        .canvas-ai-input-container.loading .ai-input-card {
          background: rgba(59, 130, 246, 0.05);
          border-color: rgba(59, 130, 246, 0.2);
        }

        .ai-avatar-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          min-width: 48px;
        }

        .ai-avatar {
          position: relative;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ai-status-indicator {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          transition: all 0.3s ease;
        }

        .ai-status-indicator.analyzing {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          animation: pulse 2s infinite;
        }

        .ai-status-indicator.searching {
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          animation: rotate 2s linear infinite;
        }

        .ai-status-indicator.generating {
          background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          animation: glow 1.5s ease-in-out infinite alternate;
        }

        .processing-ring {
          position: absolute;
          top: -4px;
          left: -4px;
          width: 56px;
          height: 56px;
          pointer-events: none;
        }

        .processing-circle {
          width: 100%;
          height: 100%;
          color: #667eea;
          animation: rotate 2s linear infinite;
        }

        .processing-message {
          text-align: center;
          min-height: 40px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
        }

        .processing-text {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
        }

        .processing-dots {
          display: flex;
          justify-content: center;
          gap: 2px;
        }

        .processing-dots span {
          width: 4px;
          height: 4px;
          background: #6b7280;
          border-radius: 50%;
          animation: dot-bounce 1.4s infinite ease-in-out both;
        }

        .processing-dots span:nth-child(1) { animation-delay: -0.32s; }
        .processing-dots span:nth-child(2) { animation-delay: -0.16s; }

        .input-section {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .ai-input-textarea {
          width: 100%;
          border: none;
          outline: none;
          background: transparent;
          font-size: 16px;
          line-height: 1.5;
          color: #374151;
          placeholder-color: #9ca3af;
          resize: none;
          min-height: 24px;
          max-height: 120px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .ai-input-textarea:disabled {
          color: #6b7280;
          cursor: not-allowed;
        }

        .input-controls {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .submit-button,
        .stop-button,
        .suggestions-button {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }

        .submit-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .submit-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .stop-button {
          background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
          color: white;
        }

        .suggestions-button {
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
        }

        .suggestions-button:hover,
        .suggestions-button.active {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        .suggestions-panel {
          margin-top: 16px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          animation: slideInUp 0.3s ease;
        }

        .suggestions-header {
          padding: 16px 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .suggestions-title {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .suggestions-title i {
          color: #fbbf24;
        }

        .close-suggestions {
          width: 24px;
          height: 24px;
          border: none;
          background: transparent;
          color: #9ca3af;
          cursor: pointer;
          border-radius: 4px;
        }

        .close-suggestions:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #6b7280;
        }

        .suggestions-grid {
          padding: 16px;
          display: grid;
          gap: 8px;
        }

        .suggestion-item {
          padding: 12px 16px;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .suggestion-item:hover {
          background: rgba(102, 126, 234, 0.05);
          border-color: rgba(102, 126, 234, 0.1);
          transform: translateY(-1px);
        }

        .suggestion-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .suggestion-text {
          font-size: 14px;
          color: #374151;
          line-height: 1.4;
          flex: 1;
        }

        .suggestion-submit {
          width: 28px;
          height: 28px;
          border: none;
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          border-radius: 6px;
          cursor: pointer;
          opacity: 0;
          transition: all 0.2s ease;
          font-size: 12px;
        }

        .suggestion-item:hover .suggestion-submit {
          opacity: 1;
        }

        .suggestion-submit:hover {
          background: rgba(102, 126, 234, 0.2);
          transform: scale(1.1);
        }

        .knowledge-base-status {
          padding: 12px 20px;
          background: rgba(102, 126, 234, 0.05);
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #6b7280;
        }

        .knowledge-base-status i {
          color: #667eea;
        }

        /* 动画 */
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes glow {
          from { box-shadow: 0 4px 12px rgba(67, 233, 123, 0.3); }
          to { box-shadow: 0 4px 20px rgba(67, 233, 123, 0.6); }
        }

        @keyframes dot-bounce {
          0%, 80%, 100% { 
            transform: scale(0);
            opacity: 0.5;
          } 
          40% { 
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes transformToNode {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          70% {
            transform: translate(-50%, -50%) scale(0.8);
            opacity: 0.3;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.6);
            opacity: 0;
          }
        }

        /* 响应式 */
        @media (max-width: 768px) {
          .canvas-ai-input-container {
            width: 95%;
            max-width: none;
          }

          .ai-input-card {
            padding: 20px;
            gap: 12px;
          }

          .ai-avatar {
            width: 40px;
            height: 40px;
          }

          .ai-status-indicator {
            width: 40px;
            height: 40px;
            font-size: 18px;
          }

          .suggestions-grid {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  )
}