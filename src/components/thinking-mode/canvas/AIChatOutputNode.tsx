'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { BaseOutputNode } from './BaseOutputNode'
import type { AIChatNode, ConversationMessage } from '@/types/outputNode'
import { Position } from '@/types/canvas'

export interface AIChatOutputNodeProps {
  node: AIChatNode
  isActive?: boolean
  onPositionChange?: (position: Position) => void
  onRemove?: () => void
  onQuestionSubmit?: (question: string) => void
  onContextCardClick?: (cardId: string) => void
}

export function AIChatOutputNode({
  node,
  isActive = false,
  onPositionChange,
  onRemove,
  onQuestionSubmit
}: AIChatOutputNodeProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(node.isExpanded ?? true)
  const [inputValue, setInputValue] = useState('')
  const messagesRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (messagesRef.current) {
      requestAnimationFrame(() => {
        if (messagesRef.current) {
          messagesRef.current.scrollTop = messagesRef.current.scrollHeight
        }
      })
    }
  }, [node.conversationHistory, node.currentQuestion, node.currentAnswer, node.status])

  // 处理输入提交
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || !onQuestionSubmit) return

    onQuestionSubmit(inputValue.trim())
    setInputValue('')
  }, [inputValue, onQuestionSubmit])

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }, [handleSubmit])

  // 渲染单个消息
  const renderMessage = (message: ConversationMessage) => {
    const isUser = message.role === 'user'

    return (
      <div key={message.id} className={`message ${isUser ? 'user-message' : 'assistant-message'}`}>
        <div className="message-content">
          {isUser ? (
            <div className="user-text">{message.content}</div>
          ) : (
            <div className="assistant-text">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <BaseOutputNode
      node={node}
      isActive={isActive}
      onPositionChange={onPositionChange}
      onRemove={onRemove}
      onToggleExpand={() => setIsExpanded(prev => !prev)}
    >
      <div className="ai-chat-content">
        {isExpanded ? (
          <>
            {/* 消息区域 */}
            <div
              ref={messagesRef}
              className="chat-messages"
            >
              {/* 显示对话历史 */}
              {node.conversationHistory.map(renderMessage)}

              {/* 如果有当前问题但还没有在历史中，显示当前问题 */}
              {node.currentQuestion && !node.conversationHistory.some(msg =>
                msg.role === 'user' && msg.content === node.currentQuestion
              ) && (
                <div className="message user-message">
                  <div className="message-content">
                    <div className="user-text">{node.currentQuestion}</div>
                  </div>
                </div>
              )}

              {/* 如果正在生成回答，显示加载状态 */}
              {(node.status === 'recalling' || node.status === 'generating') && (
                <div className="loading-indicator">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span className="loading-text">
                    {node.status === 'recalling' ? '正在召回相关内容...' : '正在生成回答...'}
                  </span>
                </div>
              )}

              {/* 如果有当前回答但还没有在历史中，显示当前回答 */}
              {node.currentAnswer && !node.conversationHistory.some(msg =>
                msg.role === 'assistant' && msg.content === node.currentAnswer
              ) && (
                <div className="message assistant-message">
                  <div className="message-content">
                    <div className="assistant-text">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeHighlight]}
                      >
                        {node.currentAnswer}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 输入框 */}
            <div className="chat-input-container">
              <form onSubmit={handleSubmit} className="chat-input-form">
                <div className="input-wrapper">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="继续提问..."
                    className="chat-input"
                    disabled={node.status === 'recalling' || node.status === 'generating'}
                  />
                  <button
                    type="submit"
                    className="send-button"
                    disabled={!inputValue.trim() || node.status === 'recalling' || node.status === 'generating'}
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
              </form>
            </div>
          </>
        ) : (
          // 收起状态
          <div className="collapsed-content">
            <div className="collapsed-question">
              {node.currentQuestion || '点击展开查看详情'}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        /* 主容器 */
        .ai-chat-content {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 600px;
          min-height: 400px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          overflow: hidden;
          box-shadow:
            0 10px 25px rgba(0, 0, 0, 0.1),
            0 4px 10px rgba(0, 0, 0, 0.05);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .ai-chat-content:hover {
          box-shadow:
            0 15px 35px rgba(0, 0, 0, 0.15),
            0 6px 15px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        /* 消息区域 */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 20px;
          background: transparent;
          min-height: 0;
          scroll-behavior: smooth;
        }

        .chat-messages::-webkit-scrollbar {
          width: 6px;
        }

        .chat-messages::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }

        .chat-messages::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
          border-radius: 10px;
        }

        .chat-messages::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
        }

        /* 消息样式 */
        .message {
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
        }

        .user-message {
          align-items: flex-end;
        }

        .assistant-message {
          align-items: flex-start;
        }

        .message-content {
          max-width: 85%;
          padding: 12px 16px;
          border-radius: 20px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          backdrop-filter: blur(20px);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .user-message .message-content {
          background: linear-gradient(135deg,
            rgba(59, 130, 246, 0.9) 0%,
            rgba(99, 102, 241, 0.9) 100%);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow:
            0 4px 16px rgba(59, 130, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .user-message .message-content:hover {
          transform: translateY(-1px);
          box-shadow:
            0 6px 20px rgba(59, 130, 246, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }

        .assistant-message .message-content {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          color: #374151;
          box-shadow:
            0 2px 8px rgba(0, 0, 0, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.5);
          border: 1px solid rgba(226, 232, 240, 0.8);
        }

        .assistant-message .message-content:hover {
          background: rgba(255, 255, 255, 0.95);
          box-shadow:
            0 4px 12px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
          transform: translateY(-1px);
        }

        /* 加载状态 */
        .loading-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(239, 246, 255, 0.8);
          backdrop-filter: blur(8px);
          border-radius: 16px;
          margin: 8px 0;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(147, 197, 253, 0.3);
          max-width: 85%;
        }

        .loading-dots {
          display: flex;
          gap: 4px;
        }

        .loading-dots span {
          width: 6px;
          height: 6px;
          background: #3b82f6;
          border-radius: 50%;
          animation: dot-bounce 1.4s infinite ease-in-out both;
        }

        .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots span:nth-child(2) { animation-delay: -0.16s; }

        .loading-text {
          font-size: 13px;
          color: #1e40af;
          font-weight: 500;
        }

        @keyframes dot-bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        /* 输入框区域 */
        .chat-input-container {
          padding: 16px;
          border-top: 1px solid rgba(226, 232, 240, 0.5);
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
        }

        .chat-input-form {
          width: 100%;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          border: 1.5px solid rgba(226, 232, 240, 0.6);
          border-radius: 20px;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow:
            0 4px 20px rgba(0, 0, 0, 0.04),
            inset 0 1px 0 rgba(255, 255, 255, 0.8);
          overflow: hidden;
        }

        .input-wrapper:focus-within {
          border-color: rgba(59, 130, 246, 0.6);
          background: rgba(255, 255, 255, 0.98);
          box-shadow:
            0 0 0 3px rgba(59, 130, 246, 0.1),
            0 8px 32px rgba(59, 130, 246, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          transform: translateY(-1px);
        }

        .chat-input {
          flex: 1;
          border: none;
          outline: none;
          padding: 14px 18px;
          font-size: 14px;
          background: transparent;
          color: #334155;
        }

        .chat-input::placeholder {
          color: #94a3b8;
        }

        .chat-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .send-button {
          width: 40px;
          height: 40px;
          border: none;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border-radius: 14px;
          margin: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow:
            0 4px 12px rgba(59, 130, 246, 0.3),
            0 2px 6px rgba(59, 130, 246, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          font-size: 14px;
        }

        .send-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: scale(1.05) translateY(-1px);
          box-shadow:
            0 6px 20px rgba(59, 130, 246, 0.4),
            0 3px 10px rgba(59, 130, 246, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.25);
        }

        .send-button:disabled {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
          opacity: 0.7;
        }

        /* 收起状态 */
        .collapsed-content {
          padding: 24px;
          text-align: center;
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(10px);
          border-radius: 24px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .collapsed-question {
          font-size: 15px;
          font-weight: 500;
          color: #374151;
          line-height: 1.5;
        }

        /* 暗色模式支持 */
        @media (prefers-color-scheme: dark) {
          .ai-chat-content {
            background: #0f172a;
            border-color: #334155;
            box-shadow:
              0 10px 25px rgba(0, 0, 0, 0.4),
              0 4px 10px rgba(0, 0, 0, 0.2);
          }

          .ai-chat-content:hover {
            box-shadow:
              0 15px 35px rgba(0, 0, 0, 0.6),
              0 6px 15px rgba(0, 0, 0, 0.3);
          }

          .assistant-message .message-content {
            background: rgba(30, 41, 59, 0.8);
            color: #e2e8f0;
            border-color: rgba(71, 85, 105, 0.8);
          }

          .user-message .message-content {
            background: linear-gradient(135deg,
              rgba(59, 130, 246, 0.9) 0%,
              rgba(99, 102, 241, 0.9) 100%);
            border-color: rgba(255, 255, 255, 0.2);
          }

          .chat-input-container {
            background: rgba(30, 41, 59, 0.95);
            border-top-color: rgba(71, 85, 105, 0.5);
          }

          .input-wrapper {
            background: rgba(30, 41, 59, 0.8);
            border-color: rgba(71, 85, 105, 0.8);
          }

          .input-wrapper:focus-within {
            background: rgba(30, 41, 59, 0.95);
            border-color: rgba(59, 130, 246, 0.6);
          }

          .chat-input {
            color: #e2e8f0;
          }

          .chat-input::placeholder {
            color: #64748b;
          }

          .loading-indicator {
            background: rgba(30, 58, 138, 0.4);
            border-color: rgba(59, 130, 246, 0.5);
          }

          .loading-text {
            color: #93bbfc;
          }

          .collapsed-content {
            background: rgba(30, 41, 59, 0.3);
          }

          .collapsed-question {
            color: #e2e8f0;
          }
        }
      `}</style>
    </BaseOutputNode>
  )
}