'use client'

import React from 'react'

interface CanvasEmptyStateProps {
  onStartThinking: () => void
  isVisible: boolean
  onQuestionSubmit?: (question: string) => void
  isProcessing?: boolean
}

export function CanvasEmptyState({ onStartThinking, isVisible, onQuestionSubmit, isProcessing = false }: CanvasEmptyStateProps) {
  const [showInput, setShowInput] = React.useState(false)
  const [question, setQuestion] = React.useState('')
  const inputRef = React.useRef<HTMLInputElement>(null)

  if (!isVisible) return null

  const handleStartThinking = () => {
    if (onQuestionSubmit) {
      setShowInput(true)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      onStartThinking()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (question.trim() && onQuestionSubmit) {
      onQuestionSubmit(question.trim())
      setQuestion('')
      setShowInput(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowInput(false)
      setQuestion('')
    }
  }

  return (
    <div className="canvas-empty-state">
      <div className="empty-content">
        <div className="empty-icon">
          <i className="fas fa-lightbulb"></i>
        </div>
        <h3 className="empty-title">开始你的思考之旅</h3>
        <p className="empty-description">
          拖拽左侧的笔记到画布，或者在下方输入问题开始与AI对话
        </p>
        
        {/* 集成的输入框 */}
        {showInput ? (
          <form onSubmit={handleSubmit} className="integrated-input-form">
            <div className="input-wrapper">
              <input
                ref={inputRef}
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="问一个问题，让AI为你召回相关的知识卡片..."
                className="question-input"
                disabled={isProcessing}
              />
              <button
                type="submit"
                className="submit-btn"
                disabled={!question.trim() || isProcessing}
              >
                {isProcessing ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-paper-plane"></i>
                )}
              </button>
            </div>
            <div className="input-tips">
              <span className="tip">按 Enter 提交，按 Esc 取消</span>
            </div>
          </form>
        ) : (
          <button 
            className="start-thinking-btn"
            onClick={handleStartThinking}
          >
            <i className="fas fa-robot"></i>
            开始思考
          </button>
        )}
        
        <div className="tips">
          <div className="tip-item">
            <i className="fas fa-mouse"></i>
            <span>拖拽笔记到画布创建知识卡片</span>
          </div>
          <div className="tip-item">
            <i className="fas fa-comments"></i>
            <span>与AI对话，自动召回相关知识</span>
          </div>
          <div className="tip-item">
            <i className="fas fa-project-diagram"></i>
            <span>查看知识之间的关系连接</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .canvas-empty-state {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          z-index: 10;
          max-width: 480px;
          padding: 0 24px;
        }

        .empty-content {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 24px;
          padding: 48px 32px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 24px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: #f59e0b;
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
        }

        .empty-title {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 12px 0;
        }

        .empty-description {
          font-size: 16px;
          color: #6b7280;
          margin: 0 0 32px 0;
          line-height: 1.5;
        }

        .start-thinking-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 12px 24px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }

        .start-thinking-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(59, 130, 246, 0.4);
        }

        /* 集成输入框样式 */
        .integrated-input-form {
          margin-bottom: 32px;
          width: 100%;
          max-width: 400px;
          margin-left: auto;
          margin-right: auto;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.9);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 16px;
          padding: 12px 16px;
          gap: 12px;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1);
        }

        .input-wrapper:focus-within {
          border-color: rgba(59, 130, 246, 0.5);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 16px rgba(59, 130, 246, 0.2);
        }

        .question-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 16px;
          color: #1f2937;
          placeholder-color: #9ca3af;
        }

        .question-input::placeholder {
          color: #9ca3af;
        }

        .submit-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .submit-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
        }

        .submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }

        .input-tips {
          margin-top: 8px;
          text-align: center;
        }

        .input-tips .tip {
          font-size: 12px;
          color: #6b7280;
        }

        .tips {
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .tip-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(59, 130, 246, 0.05);
          border-radius: 12px;
          font-size: 14px;
          color: #4b5563;
          text-align: left;
        }

        .tip-item i {
          width: 20px;
          color: #3b82f6;
          font-size: 16px;
        }

        /* 暗色模式 */
        @media (prefers-color-scheme: dark) {
          .empty-content {
            background: rgba(31, 41, 55, 0.95);
            border-color: rgba(255, 255, 255, 0.1);
          }

          .empty-title {
            color: #f9fafb;
          }

          .empty-description {
            color: #9ca3af;
          }

          .tip-item {
            background: rgba(59, 130, 246, 0.1);
            color: #d1d5db;
          }
        }

        /* 响应式设计 */
        @media (max-width: 640px) {
          .canvas-empty-state {
            max-width: 320px;
          }

          .empty-content {
            padding: 32px 24px;
          }

          .empty-icon {
            width: 60px;
            height: 60px;
            font-size: 24px;
          }

          .empty-title {
            font-size: 20px;
          }

          .empty-description {
            font-size: 14px;
          }

          .tips {
            gap: 12px;
          }

          .tip-item {
            padding: 10px 14px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  )
}