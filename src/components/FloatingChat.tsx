'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import AgentModeSwitch, { AgentMode } from './AgentModeSwitch'
import DiffCard, { DiffAction } from './DiffCard'
import DiffSummaryBar from './DiffSummaryBar'
import { StreamToolDetector } from '@/utils/streamToolDetector'

interface FloatingChatProps {
  isVisible: boolean
  onClose: () => void
  position: { x: number; y: number }
  onPositionChange: (position: { x: number; y: number }) => void
  size: { width: number; height: number }
  onSizeChange: (size: { width: number; height: number }) => void
  originalContent: string
  structuredNotes?: string  // 添加结构化笔记内容
  forceExpanded?: boolean
  onExpandedChange?: (expanded: boolean) => void
  // Diff 管理相关
  pendingDiffs?: DiffAction[]
  allDiffs?: DiffAction[]  // 添加完整的diffs数组
  onAcceptDiff?: (diffId: string) => void
  onRejectDiff?: (diffId: string) => void
  onAcceptAllDiffs?: () => void
  onRejectAllDiffs?: () => void
  onAddDiff?: (diff: DiffAction) => void
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  diffs?: DiffAction[]  // Agent 模式下的 diff 数据
}

export default function FloatingChat({
  isVisible,
  onClose,
  position,
  onPositionChange,
  size,
  onSizeChange,
  originalContent,
  structuredNotes,
  forceExpanded = false,
  onExpandedChange,
  pendingDiffs = [],
  allDiffs = [],
  onAcceptDiff,
  onRejectDiff,
  onAcceptAllDiffs,
  onRejectAllDiffs,
  onAddDiff
}: FloatingChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingTool, setIsGeneratingTool] = useState(false)
  const [agentMode, setAgentMode] = useState<AgentMode>('ask')
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeDirection, setResizeDirection] = useState<string>('')
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isExpanded, setIsExpanded] = useState(false)
  const [lastRequestTime, setLastRequestTime] = useState(0) // 防止重复请求
  const [retryCount, setRetryCount] = useState(0) // 重试计数
  const [currentUserMessage, setCurrentUserMessage] = useState<string>('') // 保存当前请求内容
  
  // 工具检测器实例
  const toolDetectorRef = useRef<StreamToolDetector>(new StreamToolDetector())
  // 用于停止响应的 AbortController
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // 监听 forceExpanded 变化
  useEffect(() => {
    if (forceExpanded) {
      setIsExpanded(true)
      onExpandedChange?.(false) // 清除强制展开标志
    }
  }, [forceExpanded, onExpandedChange])
  
  // 调试：监听isExpanded变化
  useEffect(() => {
    console.log('isExpanded 状态变化:', isExpanded)
  }, [isExpanded])

  const chatRef = useRef<HTMLDivElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const lastMoveTime = useRef<number>(0)
  const animationId = useRef<number | null>(null)
  const windowBounds = useRef({ width: 0, height: 0 })

  // 改进的拖拽功能 - 只在特定区域允许拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isResizing) return
    
    const target = e.target as HTMLElement
    const tagName = target.tagName.toLowerCase()
    
    // 排除所有交互元素
    if (tagName === 'textarea' || tagName === 'button' || tagName === 'input' || tagName === 'i') {
      return
    }
    
    // 排除按钮内的元素
    if (target.closest('button')) {
      return
    }
    
    // 检查是否在标题栏区域（允许拖拽）
    const isInHeader = target.closest('.chat-header')
    
    if (isInHeader) {
      // 在标题栏区域，允许拖拽
    } else {
      // 不在标题栏，需要更精确的检查
      
      // 排除所有具体的文本和交互内容
      const textContentSelectors = [
        '.chat-assistant-content',  // AI回复内容
        '.chat-markdown',          // Markdown内容
        'pre',                     // 代码块
        'code',                    // 行内代码
        '.diff-card',              // Diff卡片
        '.prose',                  // 文档内容
        'p', 'div[class*="text-"]', // 文本段落
        'span[class*="text-"]',    // 文本元素
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', // 标题
        'ul', 'ol', 'li',          // 列表
        'blockquote',              // 引用
        'table', 'tr', 'td', 'th', // 表格
        '.chat-bubble',            // 聊天气泡
        '.animate-fadeInUp',       // 消息容器
        '.chat-input-container',   // 输入区域
        '.chat-input-wrapper-embedded', // 输入包装器
        '.ios-switch-container'    // 开关容器
      ]
      
      // 检查是否在文本内容区域
      for (const selector of textContentSelectors) {
        if (target.closest(selector)) {
          return // 在文本区域，不允许拖拽
        }
      }
      
      // 检查是否在聊天容器的直接空白区域
      const chatCard = target.closest('.chat-card')
      if (!chatCard) {
        return // 不在聊天卡片内
      }
      
      // 如果到这里，说明在空白区域，允许拖拽
    }
    
    // 使用精确计算避免抖动
    const rect = chatRef.current?.getBoundingClientRect()
    if (!rect) return
    
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
    setIsDragging(true)
    
    // 立即禁用选择和设置样式
    e.preventDefault()
    e.stopPropagation()
    if (chatRef.current) {
      chatRef.current.style.userSelect = 'none'
      chatRef.current.style.pointerEvents = 'none' // 防止子元素干扰
    }
    document.body.style.userSelect = 'none'
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const now = performance.now()
    
    // 节流：限制到 16ms (60fps)
    if (now - lastMoveTime.current < 16) {
      return
    }
    lastMoveTime.current = now
    
    if (isDragging) {
      // 取消之前的动画帧
      if (animationId.current) {
        cancelAnimationFrame(animationId.current)
      }
      
      // 批量计算避免重复
      const bounds = windowBounds.current
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, bounds.width - size.width))
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, bounds.height - size.height))
      
      // 只在真正需要时使用 requestAnimationFrame
      animationId.current = requestAnimationFrame(() => {
        onPositionChange({ x: newX, y: newY })
        animationId.current = null
      })
      return
    }
    
    if (isResizing) {
      handleResize(e)
    }
  }, [isDragging, isResizing, dragOffset, size, onPositionChange])

  const handleMouseUp = useCallback(() => {
    if (isDragging || isResizing) {
      // 恢复文本选择和样式
      if (chatRef.current) {
        chatRef.current.style.userSelect = ''
        chatRef.current.style.pointerEvents = ''
      }
      document.body.style.userSelect = ''
    }
    
    setIsDragging(false)
    setIsResizing(false)
    setResizeDirection('')
  }, [isDragging, isResizing])

  // 简化的缩放功能
  const handleResizeStart = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation()
    e.preventDefault()
    setIsResizing(true)
    setResizeDirection(direction)
    
    if (chatRef.current) {
      chatRef.current.style.userSelect = 'none'
    }
  }

  const handleResize = (e: MouseEvent) => {
    if (!isResizing || !chatRef.current) return

    e.preventDefault()
    
    let newWidth = size.width
    let newHeight = size.height
    let newX = position.x
    let newY = position.y

    // 简化delta计算
    const mouseX = e.clientX
    const mouseY = e.clientY

    // 根据缩放方向调整尺寸和位置
    switch (resizeDirection) {
      case 'n': // 上边
        newHeight = position.y + size.height - mouseY
        newY = mouseY
        break
      case 's': // 下边
        newHeight = mouseY - position.y
        break
      case 'w': // 左边
        newWidth = position.x + size.width - mouseX
        newX = mouseX
        break
      case 'e': // 右边
        newWidth = mouseX - position.x
        break
      case 'nw': // 左上角
        newWidth = position.x + size.width - mouseX
        newHeight = position.y + size.height - mouseY
        newX = mouseX
        newY = mouseY
        break
      case 'ne': // 右上角
        newWidth = mouseX - position.x
        newHeight = position.y + size.height - mouseY
        newY = mouseY
        break
      case 'sw': // 左下角
        newWidth = position.x + size.width - mouseX
        newHeight = mouseY - position.y
        newX = mouseX
        break
      case 'se': // 右下角
        newWidth = mouseX - position.x
        newHeight = mouseY - position.y
        break
    }

    // 最小尺寸限制
    if (newWidth < 320) {
      newWidth = 320
      if (resizeDirection.includes('w')) newX = position.x + size.width - 320
    }
    if (newHeight < 240) {
      newHeight = 240
      if (resizeDirection.includes('n')) newY = position.y + size.height - 240
    }

    // 最大尺寸和位置限制
    if (newX < 0) {
      newWidth += newX
      newX = 0
    }
    if (newY < 0) {
      newHeight += newY
      newY = 0
    }
    if (newX + newWidth > window.innerWidth) {
      newWidth = window.innerWidth - newX
    }
    if (newY + newHeight > window.innerHeight) {
      newHeight = window.innerHeight - newY
    }

    onSizeChange({ width: newWidth, height: newHeight })
    if (newX !== position.x || newY !== position.y) {
      onPositionChange({ x: newX, y: newY })
    }
  }

  // 更新窗口边界缓存
  useEffect(() => {
    const updateBounds = () => {
      windowBounds.current = {
        width: window.innerWidth,
        height: window.innerHeight
      }
    }
    
    updateBounds()
    window.addEventListener('resize', updateBounds, { passive: true })
    return () => window.removeEventListener('resize', updateBounds)
  }, [])

  // 监听全局鼠标事件
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove, { passive: true })
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        // 清理动画帧
        if (animationId.current) {
          cancelAnimationFrame(animationId.current)
          animationId.current = null
        }
      }
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp])

  // 停止响应
  const handleStopResponse = () => {
    console.log('🛑 [User Stop] 用户主动停止响应生成')
    console.log('🛑 [User Stop] 当前状态:', {
      isLoading,
      isGeneratingTool,
      hasAbortController: !!abortControllerRef.current,
      messagesCount: messages.length
    })
    
    if (abortControllerRef.current) {
      console.log('🛑 [User Stop] 触发 AbortController.abort()')
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
    setIsGeneratingTool(false)
    
    // 添加停止提示
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1]
      if (lastMsg && lastMsg.role === 'assistant') {
        console.log('🛑 [User Stop] 在最后一条助手消息中添加停止标记')
        return prev.map(msg => 
          msg.id === lastMsg.id 
            ? { ...msg, content: msg.content + '\n\n_（已停止生成）_' }
            : msg
        )
      }
      console.log('🛑 [User Stop] 没有找到待更新的助手消息')
      return prev
    })
    
    console.log('🏁 [User Stop] 用户停止操作完成')
  }

  // 自动重试函数
  const retryRequest = async () => {
    if (retryCount >= 1) { // 最多重试1次
      console.log('🚫 已达到最大重试次数，不再重试')
      return
    }
    
    console.log(`🔄 开始第 ${retryCount + 1} 次重试...`)
    setRetryCount(prev => prev + 1)
    
    // 等待1秒再重试
    setTimeout(() => {
      sendMessageInternal(currentUserMessage, true)
    }, 1000)
  }

  // 内部发送消息函数
  const sendMessageInternal = async (messageContent: string, isRetry: boolean = false) => {
    setIsLoading(true)
    
    // 重置工具检测器
    toolDetectorRef.current.reset()
    setIsGeneratingTool(false)
    
    // 创建新的 AbortController
    abortControllerRef.current = new AbortController()

    // 如果不是重试，添加用户消息到聊天记录
    if (!isRetry) {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: messageContent,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, userMessage])
    }

    try {
      // 根据模式选择不同的 API 端点
      const apiEndpoint = agentMode === 'agent' ? '/api/agent-chat-stream' : '/api/chat-stream'
      
      if (isRetry) {
        console.log(`🔄 [重试] 第 ${retryCount} 次重试请求: ${messageContent.substring(0, 50)}...`)
      } else {
        console.log(`📤 [Chat] 发送新请求到 ${apiEndpoint}:`, {
          messageLength: messageContent.length,
          structuredNotesLength: structuredNotes?.length || 0,
          mode: agentMode,
          historyCount: messages.slice(-4).length
        })
      }
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          context: originalContent,
          structuredNotes: structuredNotes, // 传递结构化笔记内容
          history: messages.slice(-4), // 保持最近4条消息作为历史
          mode: agentMode
        }),
        signal: abortControllerRef.current.signal // 添加 abort signal
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        diffs: []
      }

      setMessages(prev => [...prev, assistantMessage])

      // 流式响应处理
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.type === 'content' && data.content) {
                  // 使用工具检测器处理内容
                  const cleanContent = toolDetectorRef.current.processChunk(data.content)
                  const isGenTool = toolDetectorRef.current.isGeneratingTool()
                  
                  // 更新工具生成状态
                  setIsGeneratingTool(isGenTool)
                  
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === assistantMessage.id 
                        ? { ...msg, content: cleanContent }
                        : msg
                    )
                  )
                } else if (data.type === 'diff' && data.diff) {
                  // 处理 diff 数据
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.id === assistantMessage.id 
                        ? { 
                            ...msg, 
                            diffs: [...(msg.diffs || []), data.diff]
                          }
                        : msg
                    )
                  )
                  
                  // 自动添加到全局 diff 管理（Agent 模式）
                  if (agentMode === 'agent' && onAddDiff) {
                    onAddDiff(data.diff)
                  }
                } else if (data.type === 'error' && data.error) {
                  // 检查是否是超时错误
                  const isTimeoutError = data.error.includes('连接超时') || 
                                       data.error.includes('自动重试') ||
                                       data.error.includes('响应时间过长')
                  
                  if (isTimeoutError && !isRetry) {
                    console.log('🔄 检测到超时错误，准备自动重试...')
                    // 延迟重试，先让当前流结束
                    setTimeout(() => {
                      retryRequest()
                    }, 500)
                    return // 不抛出错误，等待重试
                  }
                  
                  // 处理其他服务器返回的错误或重试后仍然失败的错误
                  throw new Error(data.error)
                }
              } catch (e) {
                if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
                  // 如果是真实的错误（不是JSON解析问题），重新抛出
                  throw e
                }
                console.warn('Failed to parse SSE data:', e)
              }
            }
          }
        }
      }
    } catch (error: any) {
      // 如果是用户主动取消，不显示错误
      if (error.name === 'AbortError') {
        console.log('📱 [Client Abort] 检测到 AbortError - 用户主动停止了响应')
        console.log('📱 [Client Abort] 取消详情:', {
          errorName: error.name,
          errorMessage: error.message,
          isRetry,
          currentMessage: messageContent.substring(0, 50) + '...'
        })
        return
      }
      
      // 检查是否是超时错误并且不是重试请求
      const isTimeoutError = error.message && (
        error.message.includes('连接超时') || 
        error.message.includes('自动重试') ||
        error.message.includes('响应时间过长')
      )
      
      if (isTimeoutError && !isRetry) {
        console.log('🔄 检测到网络超时错误，准备自动重试...')
        setTimeout(() => {
          retryRequest()
        }, 1000)
        return // 不显示错误，等待重试
      }
      
      console.error('Chat error:', error)
      
      // 根据错误类型提供更具体的错误信息
      let errorContent = '抱歉，发生了错误，请稍后重试。'
      if (error instanceof Error) {
        if (error.message.includes('网络连接中断')) {
          errorContent = '🌐 网络连接中断，请检查网络连接或稍后重试。'
        } else if (error.message.includes('请求超时') || error.message.includes('连接超时')) {
          errorContent = isRetry ? '⏱️ 重试后仍然超时，请稍后再试。' : '⏱️ 请求超时，已自动重试。'
        } else if (error.message.includes('连接被终止')) {
          errorContent = '🔌 连接被终止，请重新发起请求。'
        } else if (error.message.includes('Failed to get response')) {
          errorContent = '🚫 服务暂时不可用，请稍后重试。'
        }
      }
      
      console.error('💥 [Client Error] 请求处理异常:', {
        errorType: error.constructor.name,
        errorMessage: error.message,
        isRetry,
        retryCount,
        currentMessage: messageContent.substring(0, 50) + '...'
      })
      
      // 处理工具检测器中的未完成状态
      const finalContent = toolDetectorRef.current.handleConnectionError()
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: finalContent + '\n\n' + errorContent,
        timestamp: new Date()
      }
      
      // 更新最后一条助手消息，如果存在的话
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1]
        if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content === '') {
          // 更新空的助手消息
          return prev.map(msg => 
            msg.id === lastMsg.id 
              ? { ...msg, content: finalContent + '\n\n' + errorContent }
              : msg
          )
        } else {
          // 添加新的错误消息
          return [...prev, errorMessage]
        }
      })
    } finally {
      setIsLoading(false)
      setIsGeneratingTool(false)
      console.log('🔚 [Request End] 请求处理结束:', {
        messageContent: messageContent.substring(0, 50) + '...',
        isRetry,
        finalRetryCount: retryCount
      })
    }
  }

  // 发送消息 - 公共入口
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return
    
    const now = Date.now()
    if (now - lastRequestTime < 1000) { // 防止1秒内重复请求
      console.log('🚫 请求过于频繁，请稍后再试')
      return
    }
    setLastRequestTime(now)

    const messageContent = inputValue.trim()
    setCurrentUserMessage(messageContent) // 保存消息内容用于重试
    setInputValue('') // 清空输入框
    setRetryCount(0) // 重置重试计数
    
    await sendMessageInternal(messageContent, false)
  }

  // 键盘事件处理
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 自动滚动到底部
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  // 聚焦输入框
  useEffect(() => {
    if (isVisible && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isVisible])
  
  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  if (!isVisible || !originalContent || !isExpanded) return null

  return (
    <div
      ref={chatRef}
      className="fixed z-[60] flex flex-col chat-floating-container chat-fade-in"
      style={{
        left: 0,
        top: 0,
        width: size.width,
        height: size.height,
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        cursor: isDragging ? 'grabbing' : 'default',
        willChange: isDragging ? 'transform' : 'auto'
      }}
    >
      {/* 主容器 - 毛玻璃效果 */}
      <div 
        className="chat-card h-full flex flex-col overflow-hidden"
        onMouseDown={handleMouseDown}
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-4 py-2 chat-header cursor-grab active:cursor-grabbing">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <div className="w-2 h-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full shadow-sm"></div>
              <div className="absolute inset-0 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-20"></div>
            </div>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">AI 助手</span>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClose()
            }}
            className="p-1 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-all duration-200 group"
            title="关闭"
          >
            <i className="fas fa-times text-gray-500 dark:text-gray-400 text-xs group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors"></i>
          </button>
        </div>

        {/* 消息区域 */}
        <div
          ref={messagesRef}
          className="flex-1 overflow-y-auto px-4 pb-4 space-y-4 chat-messages custom-scrollbar"
        >
          {messages.length === 0 && (
            <div className="text-center py-12 chat-empty-state">
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`animate-fadeInUp ${message.role === 'user' ? 'flex justify-end' : ''}`}
            >
              {message.role === 'user' ? (
                <div className="max-w-[85%] chat-bubble chat-bubble-user">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              ) : (
                <div className="w-full chat-assistant-content space-y-3">
                  <div className="prose prose-sm max-w-none dark:prose-invert chat-markdown">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeHighlight]}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                  
                  {/* 显示消息中的 Diff 卡片 */}
                  {message.diffs && message.diffs.length > 0 && (
                    <div className="space-y-2">
                      {message.diffs.map((diff) => {
                        // 从完整的全局diffs数组中获取最新状态
                        const globalDiff = allDiffs.find(gd => gd.id === diff.id)
                        const currentDiff = globalDiff || diff
                        
                        return (
                          <DiffCard
                            key={diff.id}
                            diff={currentDiff}
                            onAccept={onAcceptDiff || (() => {})}
                            onReject={onRejectDiff || (() => {})}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>


        {/* 输入区域 - 内嵌式设计 */}
        <div className="chat-input-container px-4 pb-2 border-t border-gray-200/50 dark:border-gray-700/50">
          {/* 工具生成状态提示条 */}
          {isGeneratingTool && agentMode === 'agent' && (
            <div className="mb-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-md flex items-center justify-start space-x-2 text-xs text-blue-600 dark:text-blue-400">
              <span>笔记修改建议生成中</span>
              <span className="dots-loading">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          )}
          
          <div className={`chat-input-wrapper-embedded ${isLoading ? 'ai-responding' : ''}`}>
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={agentMode === 'ask' 
                ? "输入您的问题... (Enter 发送，Shift+Enter 换行)" 
                : "输入想法让 AI 整理到结构化笔记... (Enter 发送，Shift+Enter 换行)"
              }
              className="chat-input-embedded"
              rows={3}
              disabled={false}
            />
            
            {/* 内嵌控制按钮 */}
            <div className="chat-input-controls">
              {/* 左下角：iOS风格开关 */}
              <div className="ios-switch-container">
                <div 
                  className={`ios-switch ${agentMode === 'ask' ? 'switch-ask' : 'switch-agent'} ${isLoading ? 'disabled' : ''}`}
                  onClick={(e) => {
                    if (isLoading) return
                    e.preventDefault()
                    e.stopPropagation()
                    setAgentMode(agentMode === 'ask' ? 'agent' : 'ask')
                  }}
                  title={`当前: ${agentMode === 'ask' ? 'Ask' : 'Agent'} 模式，点击切换`}
                >
                  {/* 轨道背景 */}
                  <div className="switch-track-bg"></div>
                  
                  {/* 文字标签 */}
                  <div className="switch-labels">
                    <span className="label-ask">Ask</span>
                    <span className="label-agent">Agent</span>
                  </div>
                  
                  {/* 滑动的小圆 */}
                  <div className="switch-thumb-circle">
                    <i className={`fas ${agentMode === 'ask' ? 'fa-comments' : 'fa-robot'} thumb-icon`}></i>
                  </div>
                </div>
              </div>
              
              {/* 右下角：发送按钮 */}
              <button
                onClick={isLoading ? handleStopResponse : handleSendMessage}
                disabled={!isLoading && !inputValue.trim()}
                className={`chat-send-btn-embedded ${isLoading ? 'loading' : ''}`}
                title={isLoading ? "停止生成" : "发送消息"}
              >
                <i className={`fas ${isLoading ? 'fa-stop rotating' : 'fa-paper-plane'}`}></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 缩放区域 - 四条边 */}
      <div className="absolute top-0 left-2 right-2 h-2 cursor-n-resize" onMouseDown={(e) => handleResizeStart(e, 'n')} />
      <div className="absolute bottom-0 left-2 right-2 h-2 cursor-s-resize" onMouseDown={(e) => handleResizeStart(e, 's')} />
      <div className="absolute left-0 top-2 bottom-2 w-2 cursor-w-resize" onMouseDown={(e) => handleResizeStart(e, 'w')} />
      <div className="absolute right-0 top-2 bottom-2 w-2 cursor-e-resize" onMouseDown={(e) => handleResizeStart(e, 'e')} />
      
      {/* 缩放区域 - 四个角 */}
      <div className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
      <div className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
      <div className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize" onMouseDown={(e) => handleResizeStart(e, 'sw')} />
      <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize" onMouseDown={(e) => handleResizeStart(e, 'se')} />
    </div>
  )
}