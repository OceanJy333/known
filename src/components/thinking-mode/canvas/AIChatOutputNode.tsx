'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { BaseOutputNode } from './BaseOutputNode'
import type { AIChatNode, ConversationMessage } from '@/types/outputNode'
import { Position } from '@/types/canvas'
import { KnowledgeNote } from '@/types/knowledge'

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
  onQuestionSubmit,
  onContextCardClick
}: AIChatOutputNodeProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(node.isExpanded ?? true)
  const [inputValue, setInputValue] = useState('')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const chatContentRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (chatContentRef.current) {
      chatContentRef.current.scrollTop = chatContentRef.current.scrollHeight
    }
  }, [node.conversationHistory])

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

  // 渲染对话消息
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
                components={{
                  p: ({ children }) => <p style={{ margin: '0 0 12px 0' }}>{children}</p>,
                  ul: ({ children }) => <ul style={{ margin: '0 0 12px 16px' }}>{children}</ul>,
                  ol: ({ children }) => <ol style={{ margin: '0 0 12px 16px' }}>{children}</ol>,
                  code: ({ children, className }) => {
                    const isBlock = className?.includes('language-')
                    return isBlock ? (
                      <pre style={{ 
                        background: '#f8f9fa', 
                        padding: '12px', 
                        borderRadius: '6px',
                        margin: '8px 0',
                        overflow: 'auto' 
                      }}>
                        <code className={className}>{children}</code>
                      </pre>
                    ) : (
                      <code style={{ 
                        background: '#f1f3f4', 
                        padding: '2px 4px', 
                        borderRadius: '3px',
                        fontSize: '0.9em'
                      }}>{children}</code>
                    )
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <div className="message-time">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    )
  }

  // 渲染当前问题和回答
  const renderCurrentQA = () => {
    if (!node.currentQuestion) return null

    return (
      <div className="current-qa">
        {/* 当前问题 */}
        <div className="current-question">
          <div className="question-text">{node.currentQuestion}</div>
        </div>

        {/* 当前回答 */}
        {node.currentAnswer && (
          <div className="current-answer">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                p: ({ children }) => <p style={{ margin: '0 0 12px 0' }}>{children}</p>,
                ul: ({ children }) => <ul style={{ margin: '0 0 12px 16px' }}>{children}</ul>,
                ol: ({ children }) => <ol style={{ margin: '0 0 12px 16px' }}>{children}</ol>,
                code: ({ children, className }) => {
                  const isBlock = className?.includes('language-')
                  return isBlock ? (
                    <pre style={{ 
                      background: '#f8f9fa', 
                      padding: '12px', 
                      borderRadius: '6px',
                      margin: '8px 0',
                      overflow: 'auto' 
                    }}>
                      <code className={className}>{children}</code>
                    </pre>
                  ) : (
                    <code style={{ 
                      background: '#f1f3f4', 
                      padding: '2px 4px', 
                      borderRadius: '3px',
                      fontSize: '0.9em'
                    }}>{children}</code>
                  )
                }
              }}
            >
              {node.currentAnswer}
            </ReactMarkdown>
          </div>
        )}

        {/* 加载状态 */}
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
      </div>
    )
  }

  // 渲染上下文卡片
  const renderContextCards = () => {
    const contextCards = node.contextCards || node.recalledCards || []
    
    console.log('🔗 [上下文卡片] 渲染上下文卡片:', {
      contextCards: contextCards.length,
      recalledCards: node.recalledCards?.length || 0,
      nodeId: node.id
    })
    
    if (contextCards.length === 0) return null

    return (
      <div className="context-cards">
        <div className="context-header">
          <i className="fas fa-link"></i>
          <span>上下文卡片 ({contextCards.length})</span>
        </div>
        <div className="context-list">
          {contextCards.map(card => (
            <div 
              key={card.id} 
              className="context-card"
              onClick={() => onContextCardClick?.(card.id)}
            >
              <div className="context-card-title">{card.title}</div>
              <div className="context-card-summary">
                {card.summary ? card.summary.slice(0, 80) + '...' : '暂无摘要'}
              </div>
            </div>
          ))}
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
            {/* 对话历史 */}
            {node.conversationHistory.length > 0 && (
              <div className="chat-history" ref={chatContentRef}>
                {node.conversationHistory.map(renderMessage)}
              </div>
            )}

            {/* 当前问答 */}
            {renderCurrentQA()}

            {/* 上下文卡片 */}
            {renderContextCards()}

            {/* 输入框 */}
            <div className="chat-input-container">
              <form onSubmit={handleSubmit} className="chat-input-form">
                <div className={`input-wrapper ${isInputFocused ? 'focused' : ''}`}>
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
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
          /* 收起状态 */
          <div className="collapsed-content">
            <div className="collapsed-question">
              {node.currentQuestion || '点击展开查看详情'}
            </div>
            {(() => {
              const contextCards = node.contextCards || node.recalledCards || []
              return contextCards.length > 0 && (
                <div className="collapsed-context">
                  <i className="fas fa-link"></i>
                  <span>{contextCards.length} 个关联卡片</span>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      <style jsx>{`
        .ai-chat-content {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 600px;
          min-height: 400px;
          position: relative;
          background: linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }

        /* 对话历史 */
        .chat-history {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          min-height: 0;
        }

        .chat-history::-webkit-scrollbar {
          width: 6px;
        }

        .chat-history::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }

        .chat-history::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
          border-radius: 10px;
        }

        .chat-history::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
        }

        .message {
          margin-bottom: 20px;
          animation: messageSlideIn 0.3s ease-out;
        }

        @keyframes messageSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-content {
          padding: 16px 20px;
          border-radius: 20px;
          max-width: 85%;
          word-wrap: break-word;
          overflow-wrap: break-word;
          position: relative;
        }

        .user-message .message-content {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          margin-left: auto;
          box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .user-message .message-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
          border-radius: 20px;
          pointer-events: none;
        }

        .assistant-message .message-content {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          color: #374151;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border: 1px solid rgba(203, 213, 224, 0.5);
        }

        .message-time {
          font-size: 11px;
          color: #9ca3af;
          text-align: right;
          margin-top: 4px;
        }

        .user-message .message-time {
          text-align: right;
        }

        .assistant-message .message-time {
          text-align: left;
        }

        /* 当前问答 */
        .current-qa {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 24px;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
          min-height: 0;
        }

        .current-qa::-webkit-scrollbar {
          width: 6px;
        }

        .current-qa::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }

        .current-qa::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
          border-radius: 10px;
        }

        .current-qa::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
        }

        .current-question {
          background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 20px;
          padding: 20px 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.15);
          position: relative;
          overflow: hidden;
        }

        .current-question::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, #3b82f6, #1d4ed8);
        }

        .question-text {
          font-weight: 600;
          color: #1e40af;
          line-height: 1.6;
          font-size: 15px;
        }

        .current-answer {
          color: #374151;
          line-height: 1.7;
          font-size: 14px;
          word-wrap: break-word;
          overflow-wrap: break-word;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 16px;
          padding: 20px;
          border: 1px solid rgba(203, 213, 224, 0.3);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          max-height: 300px;
          overflow-y: auto;
        }

        .current-answer::-webkit-scrollbar {
          width: 6px;
        }

        .current-answer::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }

        .current-answer::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
          border-radius: 10px;
        }

        .current-answer::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
        }
        
        .current-answer > :global(*) {
          max-width: 100%;
        }
        
        .current-answer :global(pre) {
          max-width: 100%;
          overflow-x: auto;
          background: rgba(248, 250, 252, 0.8) !important;
          border: 1px solid rgba(203, 213, 224, 0.3);
        }

        /* 加载状态 */
        .loading-indicator {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 24px;
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-radius: 16px;
          margin-top: 20px;
          box-shadow: 0 4px 16px rgba(251, 191, 36, 0.2);
          border: 1px solid rgba(251, 191, 36, 0.3);
          animation: loadingPulse 2s ease-in-out infinite;
        }

        @keyframes loadingPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }

        .loading-dots {
          display: flex;
          gap: 4px;
        }

        .loading-dots span {
          width: 6px;
          height: 6px;
          background: #f59e0b;
          border-radius: 50%;
          animation: dot-bounce 1.4s infinite ease-in-out both;
        }

        .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
        .loading-dots span:nth-child(2) { animation-delay: -0.16s; }

        .loading-text {
          font-size: 14px;
          color: #92400e;
        }

        @keyframes dot-bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }

        /* 上下文卡片 */
        .context-cards {
          padding: 20px 24px;
          border-top: 1px solid rgba(203, 213, 224, 0.3);
          background: rgba(248, 250, 252, 0.8);
          backdrop-filter: blur(10px);
          max-height: 200px;
          overflow-y: auto;
          flex-shrink: 0;
        }

        .context-cards::-webkit-scrollbar {
          width: 6px;
        }

        .context-cards::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }

        .context-cards::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%);
          border-radius: 10px;
        }

        .context-cards::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
        }

        .context-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          font-size: 14px;
          font-weight: 600;
          color: #475569;
        }

        .context-header i {
          color: #3b82f6;
          font-size: 16px;
        }

        .context-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .context-card {
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border: 1px solid rgba(203, 213, 224, 0.4);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .context-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 3px;
          height: 100%;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          transform: scaleY(0);
          transition: transform 0.3s ease;
        }

        .context-card:hover {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-color: #3b82f6;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
        }

        .context-card:hover::before {
          transform: scaleY(1);
        }

        .context-card-title {
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }

        .context-card-summary {
          font-size: 12px;
          color: #64748b;
          line-height: 1.5;
        }

        /* 输入框 */
        .chat-input-container {
          padding: 20px 24px;
          border-top: 1px solid rgba(203, 213, 224, 0.3);
          background: rgba(248, 250, 252, 0.8);
          backdrop-filter: blur(10px);
        }

        .chat-input-form {
          width: 100%;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          border: 2px solid rgba(203, 213, 224, 0.4);
          border-radius: 16px;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .input-wrapper.focused {
          border-color: #3b82f6;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.2);
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
          width: 44px;
          height: 44px;
          border: none;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border-radius: 12px;
          margin: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .send-button:hover:not(:disabled) {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: scale(1.05);
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
        }

        .send-button:disabled {
          background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        /* 收起状态 */
        .collapsed-content {
          padding: 20px;
          text-align: center;
          color: #6b7280;
        }

        .collapsed-question {
          font-size: 14px;
          margin-bottom: 8px;
          color: #374151;
        }

        .collapsed-context {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 12px;
          color: #3b82f6;
        }
      `}</style>
    </BaseOutputNode>
  )
}