'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { CanvasCard } from './CanvasCard'
// CanvasAIInput 功能已集成到 CanvasEmptyState 中
import { QuestionNode, QuestionNodeData } from './QuestionNode'
import { ConnectionLayer } from './ConnectionLine'
import { AIChatOutputNode } from './AIChatOutputNode'
import { SVGCardOutputNode } from './SVGCardOutputNode'
import { CanvasToolbar } from './CanvasToolbar'
import { CanvasEmptyState } from './CanvasEmptyState'
import { DropIndicator } from './DropIndicator'
import { ConnectionPreview } from './ConnectionPreview'
import { ConnectionContextMenu } from './ConnectionContextMenu'
import { ConnectionShortcutsHelp } from './ConnectionShortcutsHelp'
import { ConnectionHoverCard } from './ConnectionHoverCard'
import { SVGBatchExportDialog } from './SVGBatchExportDialog'
import { useCanvasStore } from './canvasStore'
import { useDragAndDrop } from './useDragAndDrop'
import { useCanvasKeyboardShortcuts } from './useCanvasKeyboardShortcuts'
import { useConnectionManager } from './useConnectionManager'
import { useConnectionKeyboardShortcuts } from './useConnectionKeyboardShortcuts'
import { useThinkingModeIds } from '@/hooks/useThinkingModeIds'
import { KnowledgeNote } from '@/types/knowledge'
import { Position, CanvasCard as CanvasCardType, CANVAS_CONSTANTS, CARD_SIZES } from '@/types/canvas'
import type { AIChatNode, SVGCardNode } from '@/types/outputNode'
import { ConnectionStatus } from '@/types/outputNode'
import { createLayoutEngine } from '@/utils/canvasLayout'
import { createRelationshipMapper } from '@/utils/relationshipMapping'
import type { ExtendedDragData, NodeType } from '@/types/nodeTypes'
import { getNodeTypeById } from '@/constants/nodeTypes'
// import { recallService } from '@/services/recallService' // 移到服务端 API

interface CanvasAreaProps {
  selectedNote?: KnowledgeNote | null
  knowledgeBase?: KnowledgeNote[]
}

export function CanvasArea({ selectedNote, knowledgeBase = [] }: CanvasAreaProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isProcessingQuestion, setIsProcessingQuestion] = useState(false)
  const [questionPositions, setQuestionPositions] = useState<Map<string, Position>>(new Map())
  
  // 客户端召回函数，调用服务端 API
  const recallCards = useCallback(async (question: string, knowledgeBase: KnowledgeNote[]) => {
    const response = await fetch('/api/recall-cards', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        knowledgeBase,
        options: {
          maxResults: 5,
          relevanceThreshold: 0.6
        }
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.details || '召回服务调用失败')
    }
    
    return await response.json()
  }, [])
  
  // 画布缩放和平移状态
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  
  // 触控板手势状态
  const [isTrackpadGesture, setIsTrackpadGesture] = useState(false)
  const [lastTouchCount, setLastTouchCount] = useState(0)
  const [gestureStartTransform, setGestureStartTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [gestureStartCenter, setGestureStartCenter] = useState({ x: 0, y: 0 })
  const [initialDistance, setInitialDistance] = useState(0)
  
  // 创建一个本地的知识库管理
  const [localKnowledgeBase, setLocalKnowledgeBase] = useState<KnowledgeNote[]>([])
  
  // 连接管理状态
  const [contextMenuState, setContextMenuState] = useState<{
    isVisible: boolean
    position: Position
    connectionId: string
    status: ConnectionStatus
  } | null>(null)
  
  // 连线悬停状态
  const [hoveredConnectionId, setHoveredConnectionId] = useState<string | null>(null)
  const [hoverCardPosition, setHoverCardPosition] = useState<Position | null>(null)
  const [currentMousePosition, setCurrentMousePosition] = useState<Position>({ x: 0, y: 0 })
  
  // 批量导出对话框状态
  const [batchExportDialogOpen, setBatchExportDialogOpen] = useState(false)
  
  // 更新本地知识库
  useEffect(() => {
    setLocalKnowledgeBase(knowledgeBase)
  }, [knowledgeBase])
  
  // 跟踪鼠标位置
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setCurrentMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])
  
  // 创建 knowledgeBase 的 Map 索引以优化查找性能
  const knowledgeBaseMap = React.useMemo(() => {
    const map = new Map<string, KnowledgeNote>()
    
    // 先添加原始知识库
    knowledgeBase.forEach(note => {
      map.set(note.id, note)
    })
    
    // 再添加本地知识库（可能包含召回的卡片）
    localKnowledgeBase.forEach(note => {
      if (!map.has(note.id)) {
        map.set(note.id, note)
      }
    })
    
    return map
  }, [knowledgeBase, localKnowledgeBase])
  
  // 使用沉思模式ID管理器
  const thinkingModeIds = useThinkingModeIds({
    autoFix: true,
    debug: process.env.NODE_ENV === 'development',
    validationInterval: 10000, // 10秒验证一次
    onError: (error) => {
      console.error('🚨 [沉思模式ID] 错误:', error)
    },
    onWarning: (warning) => {
      console.warn('⚠️ [沉思模式ID] 警告:', warning)
    }
  })
  
  // 注册知识库中的所有笔记
  useEffect(() => {
    knowledgeBase.forEach(note => {
      thinkingModeIds.registerNote(note)
    })
    
    localKnowledgeBase.forEach(note => {
      if (!knowledgeBase.find(n => n.id === note.id)) {
        thinkingModeIds.registerNote(note)
      }
    })
  }, [knowledgeBase, localKnowledgeBase, thinkingModeIds])
  
  const {
    cards,
    selectedCardIds,
    questionNodes,
    connections,
    aiInputVisible,
    activeQuestionId,
    addCard,
    addCards,
    updateCard,
    removeCard,
    selectCard,
    clearSelection,
    canDropAt,
    getSmartPosition,
    addQuestionNode,
    updateQuestionNode,
    removeQuestionNode,
    setQuestionNodeAnswer,
    setQuestionNodeStatus,
    showAIInput,
    hideAIInput,
    addConnection,
    removeConnectionsByNodeId,
    // 输出节点相关
    outputNodes,
    outputConnections,
    activeOutputNodeId,
    createOutputNode,
    updateOutputNode,
    removeOutputNode,
    setActiveOutputNode,
    addMessageToOutputNode,
    addOutputConnection,
    updateOutputConnection,
    removeOutputConnection,
    toggleCardConnection,
    getNodeContextCards,
    getNodeConnections
  } = useCanvasStore()
  
  // 注册画布状态变化
  useEffect(() => {
    // 注册所有卡片
    cards.forEach(card => {
      thinkingModeIds.registerCard(card)
    })
  }, [cards, thinkingModeIds])
  
  useEffect(() => {
    // 注册所有输出节点
    Object.values(outputNodes).forEach(node => {
      thinkingModeIds.registerOutputNode(node)
    })
  }, [outputNodes, thinkingModeIds])
  
  useEffect(() => {
    // 注册所有输出节点连接
    outputConnections.forEach(connection => {
      thinkingModeIds.registerConnection(connection)
    })
  }, [outputConnections, thinkingModeIds])
  
  // 创建布局引擎和关系映射器
  const layoutEngine = useRef(createLayoutEngine())
  const relationshipMapper = useRef(createRelationshipMapper())

  // 处理笔记和节点的放置
  const handleDropNote = useCallback((note: KnowledgeNote, position: Position) => {
    addCard({ noteId: note.id, position })
    // addCard 会自动选中新添加的卡片，所以不需要手动调用 selectCard
  }, [addCard])

  const handleDropNode = useCallback((nodeTypeId: string, position: Position) => {
    const nodeData = getNodeTypeById(nodeTypeId)
    if (nodeData) {
      createOutputNode({
        type: nodeTypeId,
        position
      })
    }
  }, [createOutputNode])

  // 使用拖拽处理Hook
  const {
    isDraggingOver,
    dropIndicatorPos,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useDragAndDrop({
    canvasRef,
    canvasTransform,
    onDropNote: handleDropNote,
    onDropNode: handleDropNode
  })
  
  // 连接管理Hook
  const {
    connectionDrag,
    selectedConnectionId,
    startConnectionDrag,
    updateConnectionPreview,
    completeConnection,
    cancelConnection,
    canCreateConnection,
    toggleConnectionStatus,
    deleteConnection,
    selectConnection,
    getConnectionPointsStatus
  } = useConnectionManager({ canvasRef, canvasTransform })
  
  // 连接键盘快捷键Hook
  const { shortcuts } = useConnectionKeyboardShortcuts({
    selectedConnectionId,
    onDeleteConnection: deleteConnection,
    onToggleConnectionStatus: toggleConnectionStatus,
    onDeselectConnection: () => selectConnection(null)
  })


  // 处理问题提交
  const handleQuestionSubmit = useCallback(async (question: string, inputPosition?: Position) => {
    if (isProcessingQuestion) return

    setIsProcessingQuestion(true)

    try {
      // 1. 创建问题节点 - 使用输入框位置或默认中心位置
      const questionPosition = inputPosition || { x: 400, y: 300 }
      const questionId = addQuestionNode(question, questionPosition)
      
      // 设置问题位置到状态中
      setQuestionPositions(prev => new Map(prev.set(questionId, questionPosition)))
      
      // 更新问题节点状态
      setQuestionNodeStatus(questionId, 'answering')
      
      // 延迟隐藏AI输入框，让转换动画完成
      setTimeout(() => {
        hideAIInput()
      }, 600) // 与输入框动画时长匹配

      // 2. 调用API处理问题
      const response = await fetch('/api/canvas-question-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          knowledgeBase: knowledgeBase.slice(0, 50) // 限制知识库大小
        }),
      })

      if (!response.ok) {
        throw new Error('API请求失败')
      }

      // 3. 处理流式响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let answer = ''
      let relatedNotes: any[] = []

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
                
                if (data.type === 'answer_content' && data.content) {
                  answer += data.content
                  updateQuestionNode(questionId, { answer })
                } else if (data.type === 'notes' && data.data) {
                  relatedNotes = data.data
                } else if (data.type === 'complete') {
                  // 处理完成，开始布局
                  await handleQuestionComplete(questionId, answer, relatedNotes)
                } else if (data.type === 'error') {
                  throw new Error(data.error)
                }
              } catch (e) {
                console.warn('解析SSE数据失败:', e)
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('处理问题失败:', error)
      // 如果有问题节点，更新为错误状态
      const errorQuestionNode = questionNodes.find(q => q.question === question)
      if (errorQuestionNode) {
        setQuestionNodeStatus(errorQuestionNode.id, 'error')
      }
    } finally {
      setIsProcessingQuestion(false)
    }
  }, [isProcessingQuestion, knowledgeBase, addQuestionNode, setQuestionNodeStatus, updateQuestionNode, questionNodes, hideAIInput])

  // 处理输出节点问题提交 - 使用召回服务的新流程
  const handleOutputNodeQuestionSubmit = useCallback(async (question: string, inputPosition?: Position) => {
    if (isProcessingQuestion) return

    setIsProcessingQuestion(true)
    
    // 1. 创建AI对话输出节点
    const nodePosition = inputPosition || { x: 400, y: 300 }
    const nodeId = createOutputNode({
      type: 'ai-chat',
      position: nodePosition,
      initialQuestion: question
    })

    try {
      // 更新节点状态为召回中
      updateOutputNode(nodeId, { status: 'recalling' })

      // 立即添加用户消息到对话历史
      addMessageToOutputNode(nodeId, {
        role: 'user',
        content: question,
        contextCards: []
      })

      // 添加空的助手消息，准备流式更新
      addMessageToOutputNode(nodeId, {
        role: 'assistant',
        content: '',
        contextCards: []
      })

      // 2. 使用召回服务召回相关卡片
      console.log('🔍 [画布编排] 开始召回相关卡片')
      const recallResult = await recallCards(question, knowledgeBase)
      
      console.log('✅ [画布编排] 召回完成:', {
        recalledCount: recallResult.cards.length,
        averageRelevance: recallResult.searchStats.averageRelevance
      })

      // 3. 添加召回的卡片到画布并连线
      const addedCardIds = await addRecalledCardsToCanvas(nodeId, recallResult.cards)
      
      // 4. 开始AI对话
      await startAiConversation(nodeId, question, recallResult.cards)

    } catch (error) {
      console.error('❌ [输出节点] 处理失败:', error)
      // 更新指定节点为错误状态
      updateOutputNode(nodeId, { status: 'error' })
    } finally {
      setIsProcessingQuestion(false)
    }
  }, [isProcessingQuestion, knowledgeBase, createOutputNode, updateOutputNode, addMessageToOutputNode, outputNodes, recallCards])

  // 辅助函数：添加召回的卡片到画布并连线
  const addRecalledCardsToCanvas = useCallback(async (nodeId: string, recalledCards: any[]) => {
    const cardIds: string[] = []
    
    // 获取节点位置，用于计算卡片位置
    const node = outputNodes[nodeId]
    const centerPosition = node ? node.position : { x: 400, y: 300 }
    
    for (let i = 0; i < recalledCards.length; i++) {
      const card = recalledCards[i]
      
      // 计算卡片位置（围绕输出节点分布）
      const angle = (i / recalledCards.length) * 2 * Math.PI
      const radius = 150
      const cardPosition = {
        x: centerPosition.x + Math.cos(angle) * radius,
        y: centerPosition.y + Math.sin(angle) * radius
      }
      
      // 添加卡片到画布
      const cardId = await thinkingModeIds.safeAddCard(card.id, cardPosition, addCard)
      if (cardId) {
        cardIds.push(cardId)
        
        // 创建连线
        const connectionId = await thinkingModeIds.safeCreateConnection(
          nodeId,
          cardId,
          addOutputConnection
        )
        
        if (connectionId) {
          console.log('✅ [画布编排] 成功创建连接:', nodeId, '->', cardId)
        } else {
          console.warn('⚠️ [画布编排] 创建连接失败:', nodeId, '->', cardId)
        }
      }
    }
    
    console.log('📋 [画布编排] 卡片添加完成:', {
      nodeId,
      addedCount: cardIds.length,
      cardIds
    })
    
    return cardIds
  }, [outputNodes, addCard, addOutputConnection, thinkingModeIds])

  // 辅助函数：开始AI对话
  const startAiConversation = useCallback(async (nodeId: string, question: string, contextCards: any[]) => {
    try {
      // 更新节点状态为生成中
      updateOutputNode(nodeId, { status: 'generating' })
      
      // 调用简化的AI对话API
      const response = await fetch('/api/output-node-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          contextCards,
          conversationHistory: [],
          nodeId,
          nodeType: 'ai-chat'
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 处理流式响应
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let answer = ''

      // 更新最后一条助手消息的函数
      const updateLastMessage = () => {
        const currentState = useCanvasStore.getState()
        const currentNode = currentState.outputNodes[nodeId]
        
        if (currentNode && currentNode.conversationHistory.length > 0) {
          const messages = [...currentNode.conversationHistory]
          const lastMessageIndex = messages.length - 1
          const lastMessage = messages[lastMessageIndex]
          
          if (lastMessage && lastMessage.role === 'assistant') {
            messages[lastMessageIndex] = {
              ...lastMessage,
              content: answer,
              contextCards: contextCards.map(c => c.id)
            }
            
            updateOutputNode(nodeId, {
              conversationHistory: messages
            })
          }
        }
      }

      // 处理流式响应
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'answer_content') {
                answer += data.data.content
                updateLastMessage()
              } else if (data.type === 'complete') {
                // 对话完成
                updateOutputNode(nodeId, { status: 'completed' })
                console.log('✅ [画布编排] AI对话完成:', { nodeId, answerLength: answer.length })
              }
            } catch (e) {
              console.warn('解析流式响应失败:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ [画布编排] AI对话失败:', error)
      updateOutputNode(nodeId, { status: 'error' })
      throw error
    }
  }, [updateOutputNode])

  // 🔥 通用接口：根据 noteId 添加卡片到画布，返回创建的卡片ID
  const addCardById = useCallback((noteId: string, position?: Position): string | null => {
    
    // 1. 验证 noteId 是否存在于知识库
    const note = knowledgeBase.find(n => n.id === noteId)
    if (!note) {
      console.error(`❌ [通用接口] noteId ${noteId} 不存在于知识库中`)
      console.error(`❌ [通用接口] 可用的 noteId:`, knowledgeBase.slice(0, 10).map(n => n.id))
      return null
    }
    
    // 2. 检查是否已存在于画布
    const existingCard = cards.find(card => card.noteId === noteId)
    if (existingCard) {
      console.warn(`⚠️ [通用接口] noteId ${noteId} 已存在于画布中`)
      return existingCard.id // 返回已存在的卡片ID
    }
    
    // 3. 检查数量限制
    if (cards.length >= CANVAS_CONSTANTS.MAX_CARDS) {
      console.error(`❌ [通用接口] 画布已达到最大卡片数量限制 (${CANVAS_CONSTANTS.MAX_CARDS})`)
      return null
    }
    
    // 4. 确定位置
    let finalPosition: Position
    if (position) {
      finalPosition = getSmartPosition(position)
    } else {
      // 默认位置：画布中心偏移
      const defaultPosition = {
        x: 400 + (cards.length * 50), // 错开放置
        y: 200 + (cards.length * 30)
      }
      finalPosition = getSmartPosition(defaultPosition)
    }
    
    
    // 5. 调用原始的 addCard 接口（手动拖拽使用的同一个）
    const cardId = addCard({
      noteId,
      position: finalPosition
    })
    
    return cardId
  }, [knowledgeBase, cards, getSmartPosition, addCard])

  // 处理输出节点追问
  const handleOutputNodeFollowUp = useCallback(async (nodeId: string, question: string) => {

    // 获取当前节点的上下文卡片
    const contextCardIds = getNodeContextCards(nodeId)
    const contextCards = contextCardIds
      .map(cardId => knowledgeBaseMap.get(cardId))
      .filter(Boolean)

    // 获取对话历史
    const node = outputNodes[nodeId] as AIChatNode
    const conversationHistory = node?.conversationHistory || []


    // 立即添加用户消息到对话历史
    addMessageToOutputNode(nodeId, {
      role: 'user',
      content: question,
      contextCards: contextCardIds
    })

    // 添加空的助手消息，准备流式更新
    addMessageToOutputNode(nodeId, {
      role: 'assistant',
      content: '',
      contextCards: contextCardIds
    })

    // 更新节点状态
    updateOutputNode(nodeId, { 
      status: 'generating'
    })

    try {
      // 调用API进行追问
      const response = await fetch('/api/output-node-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          contextCards,
          conversationHistory,
          nodeId,
          nodeType: 'ai-chat'
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 处理流式响应
      const reader = response.body!.getReader()
      const decoder = new TextDecoder()
      let answer = ''

      // 更新最后一条助手消息的函数
      const updateLastMessage = () => {
        // 使用 getState() 获取最新状态，避免闭包问题
        const currentState = useCanvasStore.getState()
        const currentNode = currentState.outputNodes[nodeId]
        
        if (currentNode && currentNode.conversationHistory.length > 0) {
          const messages = [...currentNode.conversationHistory]
          const lastMessageIndex = messages.length - 1
          const lastMessage = messages[lastMessageIndex]
          
          if (lastMessage && lastMessage.role === 'assistant') {
            messages[lastMessageIndex] = {
              ...lastMessage,
              content: answer,
              contextCards: contextCardIds
            }
            
            console.log('🔄 [更新消息] 更新助手消息内容 (追问):', {
              nodeId,
              contentLength: answer.length,
              messageIndex: lastMessageIndex
            })
            
            updateOutputNode(nodeId, {
              conversationHistory: messages
            })
          }
        }
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                if (data.type === 'answer_content') {
                  answer += data.data.content
                  console.log('📝 [流式内容] 收到内容片段:', { 
                    nodeId, 
                    contentLength: data.data.content.length,
                    totalLength: answer.length 
                  })
                  // 更新正在生成的助手消息
                  updateLastMessage()
                } else if (data.type === 'complete') {
                  // 生成完成，设置状态
                  console.log('🏁 [流式完成] 完成事件, 总内容长度:', answer.length)
                  updateOutputNode(nodeId, { 
                    status: 'completed'
                  })
                }
              } catch (e) {
                console.warn('解析追问SSE数据失败:', e)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

    } catch (error) {
      console.error('❌ [追问] 失败:', error)
      updateOutputNode(nodeId, { status: 'error' })
    }
  }, [outputNodes, getNodeContextCards, knowledgeBaseMap, updateOutputNode, addMessageToOutputNode])

  // 处理SVG卡片生成
  const handleSVGCardGeneration = useCallback(async (nodeId: string, cardIds: string[]) => {
    try {
      // 获取知识卡片数据
      const knowledgeCards = cardIds
        .map(cardId => knowledgeBaseMap.get(cardId))
        .filter(Boolean)

      if (knowledgeCards.length === 0) {
        console.warn('没有找到有效的知识卡片')
        return
      }

      console.log('🎨 [SVG卡片生成] 开始:', { nodeId, cardsCount: knowledgeCards.length })

      // 更新节点状态
      updateOutputNode(nodeId, {
        status: 'extracting',
        sourceCardIds: cardIds
      } as Partial<SVGCardNode>)

      // 调用SVG生成API
      const response = await fetch('/api/svg-card-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nodeId,
          knowledgeCards,
          template: 'modern' // 默认模板
        }),
      })

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('无法获取响应流')
      }

      // 处理流式响应
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        const lines = chunk.split('\n').filter(line => line.trim().startsWith('data:'))

        for (const line of lines) {
          try {
            const jsonStr = line.replace('data: ', '')
            const data = JSON.parse(jsonStr)

            switch (data.type) {
              case 'status':
                updateOutputNode(nodeId, { status: data.data.status } as Partial<SVGCardNode>)
                break
              
              case 'content_extracted':
                updateOutputNode(nodeId, { 
                  extractedContent: data.data.extractedContent 
                } as Partial<SVGCardNode>)
                break
              
              case 'svg_generated':
                updateOutputNode(nodeId, { 
                  status: 'completed',
                  svgContent: data.data.svgContent,
                  template: data.data.template || 'modern'
                } as Partial<SVGCardNode>)
                break
              
              case 'error':
                console.error('❌ [SVG生成] API错误:', data.message)
                updateOutputNode(nodeId, { status: 'error' } as Partial<SVGCardNode>)
                break
              
              case 'complete':
                console.log('✅ [SVG生成] 完成')
                break
            }
          } catch (e) {
            console.warn('解析SVG生成数据失败:', e)
          }
        }
      }

      reader.releaseLock()

    } catch (error) {
      console.error('❌ [SVG卡片生成] 失败:', error)
      updateOutputNode(nodeId, { status: 'error' } as Partial<SVGCardNode>)
    }
  }, [knowledgeBaseMap, updateOutputNode])

  // 处理SVG卡片模板切换
  const handleSVGTemplateChange = useCallback(async (nodeId: string, template: string) => {
    const node = outputNodes[nodeId] as SVGCardNode
    if (!node || node.type !== 'svg-card' || !node.sourceCardIds?.length) return

    // 重新生成SVG卡片
    console.log('🔄 [模板切换] 重新生成SVG卡片:', { nodeId, template })
    
    // 先更新模板
    updateOutputNode(nodeId, { template } as Partial<SVGCardNode>)
    
    // 重新生成
    await handleSVGCardGeneration(nodeId, node.sourceCardIds)
  }, [outputNodes, updateOutputNode, handleSVGCardGeneration])

  // 处理SVG卡片重新生成
  const handleSVGRegenerate = useCallback(async (nodeId: string) => {
    const node = outputNodes[nodeId] as SVGCardNode
    if (!node || node.type !== 'svg-card' || !node.sourceCardIds?.length) return

    console.log('🔄 [SVG重新生成]:', nodeId)
    await handleSVGCardGeneration(nodeId, node.sourceCardIds)
  }, [outputNodes, handleSVGCardGeneration])

  // 处理问题完成
  // 时间分片处理复杂计算
  const processWithTimeSlicing = useCallback(
    async (
      tasks: (() => any)[],
      onProgress?: (progress: number) => void
    ): Promise<any[]> => {
      const results: any[] = []
      const CHUNK_SIZE = 3 // 每次处理3个任务
      
      for (let i = 0; i < tasks.length; i += CHUNK_SIZE) {
        const chunk = tasks.slice(i, i + CHUNK_SIZE)
        
        // 在微任务中处理当前块
        await new Promise<void>(resolve => {
          setTimeout(() => {
            chunk.forEach(task => {
              results.push(task())
            })
            resolve()
          }, 0)
        })
        
        // 报告进度
        if (onProgress) {
          onProgress((i + chunk.length) / tasks.length * 100)
        }
      }
      
      return results
    },
    []
  )

  const handleQuestionComplete = useCallback(async (
    questionId: string,
    answer: string,
    relatedNotesData: any[]
  ) => {
    const startTime = performance.now()
    
    try {

      // 设置加载状态
      setQuestionNodeStatus(questionId, 'processing')

      // 1. 更新问题节点 - 从最新状态获取
      const currentState = useCanvasStore.getState()
      const questionNode = currentState.questionNodes.find(q => q.id === questionId)
      if (!questionNode) {
        console.error('❌ [DEBUG] 找不到问题节点:', questionId)
        return
      }

      // 转换为KnowledgeNote格式
      const relatedNotes: KnowledgeNote[] = relatedNotesData.map(noteData => ({
        ...noteData,
        createdAt: new Date(noteData.createdAt || Date.now()),
        updatedAt: new Date(noteData.updatedAt || Date.now()),
        lastAccessed: new Date(),
        saveHistory: []
      }))


      setQuestionNodeAnswer(questionId, answer, relatedNotes)

      // 2. 异步分析关系映射
      const relationships = await new Promise<any>((resolve) => {
        const executeAnalysis = () => {
          const result = relationshipMapper.current.analyzeQuestionNoteRelationships(
            questionNode,
            relatedNotes
          )
          resolve(result)
        }
        
        // 使用 requestIdleCallback 或 setTimeout 作为回退
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(executeAnalysis)
        } else {
          setTimeout(executeAnalysis, 0)
        }
      })

      // 3. 异步生成智能布局
      const centerPosition = questionPositions.get(questionId) || { x: 400, y: 300 }
      
      layoutEngine.current.updateConfig({ centerPosition })
      
      const layoutResult = await new Promise<any>((resolve) => {
        const executeLayout = () => {
          const result = layoutEngine.current.layoutQuestionWithNotes(
            questionNode,
            relatedNotes,
            [] // 暂时不考虑现有节点
          )
          resolve(result)
        }
        
        // 使用 requestIdleCallback 或 setTimeout 作为回退
        if (typeof requestIdleCallback !== 'undefined') {
          requestIdleCallback(executeLayout)
        } else {
          setTimeout(executeLayout, 0)
        }
      })

      // 4. 添加笔记卡片到画布 - 批量优化版本
      
      // 收集所有需要添加的卡片
      const cardsToAdd: { noteId: string; position: Position }[] = []
      
      for (const layoutNode of layoutResult.nodes) {
        
        if (layoutNode.type === 'note') {
          const relatedNote = relatedNotes.find(n => n.id === layoutNode.id)
          
          const existingCard = currentState.cards.some(c => c.noteId === layoutNode.id)
          
          if (relatedNote && !existingCard) {
            
            cardsToAdd.push({
              noteId: layoutNode.id,
              position: layoutNode.position
            })
          } else {
          }
        } else if (layoutNode.type === 'question') {
          // 更新问题节点位置
          setQuestionPositions(prev => new Map(prev.set(questionId, layoutNode.position)))
        }
      }
      
      // 批量添加所有卡片，避免多次重渲染
      if (cardsToAdd.length > 0) {
        
        addCards(cardsToAdd)
        
      } else {
      }

      // 5. 创建连接线
      const notePositions = new Map()
      for (const layoutNode of layoutResult.nodes) {
        if (layoutNode.type === 'note') {
          notePositions.set(layoutNode.id, {
            position: layoutNode.position,
            size: layoutNode.size
          })
        }
      }

      const questionPosition = questionPositions.get(questionId) || centerPosition
      const questionSize = { 
        width: CANVAS_CONSTANTS.QUESTION_NODE_WIDTH, 
        height: CANVAS_CONSTANTS.QUESTION_NODE_HEIGHT 
      }

      const connectionData = relationshipMapper.current.generateConnections(
        questionPosition,
        questionSize,
        notePositions,
        relationships
      )

      // 添加连接线
      for (const connection of connectionData) {
        addConnection(connection)
      }

      setQuestionNodeStatus(questionId, 'answered')
      
      const endTime = performance.now()
      const layoutDuration = endTime - startTime
      

    } catch (error) {
      console.error('布局处理失败:', error)
      setQuestionNodeStatus(questionId, 'error')
    }
  }, [questionPositions, addCards, addConnection, setQuestionNodeAnswer, setQuestionNodeStatus, processWithTimeSlicing])

  // 处理问题节点位置变化
  const handleQuestionPositionChange = useCallback((questionId: string, position: Position) => {
    setQuestionPositions(prev => new Map(prev.set(questionId, position)))
  }, [])

  // 处理问题节点删除
  const handleQuestionDelete = useCallback((questionId: string) => {
    removeQuestionNode(questionId)
    removeConnectionsByNodeId(questionId)
    setQuestionPositions(prev => {
      const newMap = new Map(prev)
      newMap.delete(questionId)
      return newMap
    })
  }, [removeQuestionNode, removeConnectionsByNodeId])

  // 优化卡片回调函数
  const handleCardSelect = useCallback((cardId: string, isMulti: boolean) => {
    selectCard(cardId, isMulti)
  }, [selectCard])

  const handleCardPositionChange = useCallback((cardId: string, position: Position) => {
    updateCard(cardId, { position })
  }, [updateCard])

  const handleCardSizeChange = useCallback((cardId: string, size: CanvasCardType['size']) => {
    updateCard(cardId, { size })
  }, [updateCard])

  const handleCardRemove = useCallback((cardId: string) => {
    removeCard(cardId)
  }, [removeCard])

  // 处理笔记点击
  const handleNoteClick = useCallback((noteId: string) => {
    const note = knowledgeBase.find(n => n.id === noteId)
    if (note) {
      // 这里可以添加打开笔记详情的逻辑
    }
  }, [knowledgeBase])


  // 处理画布点击（取消选择）
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      clearSelection()
      selectConnection(null)
      setContextMenuState(null)
    }
  }, [clearSelection, selectConnection])
  
  // 处理连接点拖拽开始
  const handleConnectionStart = useCallback((cardId: string, position: Position) => {
    startConnectionDrag(cardId, position)
  }, [startConnectionDrag])
  
  // 处理连接点点击（管理连接）
  const handleConnectionPointClick = useCallback((cardId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    // TODO: 显示连接管理面板
    console.log('连接点点击:', cardId)
  }, [])
  
  // 处理连接线点击
  const handleConnectionClick = useCallback((connectionId: string) => {
    console.log('📌 连接线点击:', connectionId)
    selectConnection(connectionId)
    setContextMenuState(null)
  }, [selectConnection])
  
  // 处理连接线双击（快速切换状态）
  const handleConnectionDoubleClick = useCallback((connectionId: string) => {
    toggleConnectionStatus(connectionId)
  }, [toggleConnectionStatus])
  
  // 处理连接线右键（显示菜单）
  const handleConnectionRightClick = useCallback((connectionId: string, e: React.MouseEvent) => {
    const connections = getNodeConnections()
    const connection = connections.find(conn => conn.id === connectionId)
    
    if (connection) {
      setContextMenuState({
        isVisible: true,
        position: { x: e.clientX, y: e.clientY },
        connectionId,
        status: connection.status
      })
    }
  }, [getNodeConnections])
  
  // 处理连接线悬停
  const handleConnectionHover = useCallback((connectionId: string | null) => {
    setHoveredConnectionId(connectionId)
    if (connectionId) {
      // 使用当前鼠标位置来定位悬停卡片
      setHoverCardPosition(currentMousePosition)
    } else {
      setHoverCardPosition(null)
    }
  }, [currentMousePosition])
  
  // 处理连接菜单状态改变
  const handleConnectionStatusChange = useCallback((connectionId: string, newStatus: ConnectionStatus) => {
    updateOutputConnection(connectionId, newStatus)
  }, [updateOutputConnection])
  
  // 处理批量导出
  const handleBatchExport = useCallback(() => {
    setBatchExportDialogOpen(true)
  }, [])
  
  // 获取所有SVG节点
  const svgNodes = React.useMemo(() => {
    return Object.values(outputNodes).filter(node => node.type === 'svg-card') as SVGCardNode[]
  }, [outputNodes])
  
  // 处理连接删除
  const handleConnectionDelete = useCallback((connectionId: string) => {
    deleteConnection(connectionId)
  }, [deleteConnection])
  
  // 关闭连接菜单
  const handleCloseContextMenu = useCallback(() => {
    setContextMenuState(null)
  }, [])

  // 检测是否为Mac触控板
  const isMacTrackpad = useCallback(() => {
    return navigator.userAgent.includes('Mac') && 
           ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  }, [])
  
  
  // 处理画布滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    // 检查滚动事件是否发生在AI对话节点内部
    const target = e.target as HTMLElement
    const isInAIChatNode = target.closest('.ai-chat-content') || 
                          target.closest('.chat-messages') ||
                          target.closest('.ai-input-card') ||
                          target.closest('.suggestions-panel') ||
                          target.closest('.output-node')
    
    // 如果在AI对话节点内部，不处理画布滚动
    if (isInAIChatNode) {
      return
    }
    
    // 更宽松的Mac触控板检测
    const isMacTrackpad = navigator.userAgent.includes('Mac') && 
                         // 触控板通常有更精细的滚动值，而且同时有X和Y方向的滚动
                         (e.deltaMode === 0) // DOM_DELTA_PIXEL 模式，触控板特征
    
    // Mac触控板双指缩放检测：通常包含ctrlKey或者有较大的deltaY变化
    const isMacTrackpadZoom = isMacTrackpad && (
      e.ctrlKey || // 明确的缩放手势
      (Math.abs(e.deltaY) > Math.abs(e.deltaX) * 3 && Math.abs(e.deltaY) > 10) // 主要是Y方向的大幅滚动
    )
    
    if (e.ctrlKey || e.metaKey || isMacTrackpadZoom) {
      // 缩放手势 (Ctrl/Cmd + 滚轮 或 触控板双指缩放)
      e.preventDefault()
      
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      
      // 计算鼠标相对于画布的位置
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      // 计算缩放（使用更平滑的缩放系数）
      const delta = e.deltaY * -0.002
      const newScale = Math.min(Math.max(canvasTransform.scale + delta, 0.1), 3)
      
      // 计算缩放后的偏移量，使缩放以鼠标位置为中心
      const scaleDiff = newScale - canvasTransform.scale
      const offsetX = -(mouseX * scaleDiff)
      const offsetY = -(mouseY * scaleDiff)
      
      setCanvasTransform(prev => ({
        x: prev.x + offsetX,
        y: prev.y + offsetY,
        scale: newScale
      }))
    } else if (isMacTrackpad && !e.shiftKey) {
      // Mac触控板双指平移 - 支持X和Y方向的平移
      e.preventDefault()
      setCanvasTransform(prev => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }))
    }
  }, [canvasTransform])
  
  // 处理画布平移
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // 检查是否点击的是画布空白区域（非卡片、非节点）
    const target = e.target as HTMLElement
    const isCanvasBackground = target.classList.contains('canvas-area') || 
                              target.classList.contains('canvas-content') ||
                              target.classList.contains('canvas-grid')
    
    // 中键或者Shift+左键开始平移
    if (e.button === 1 || (e.button === 0 && e.shiftKey && isCanvasBackground)) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - canvasTransform.x, y: e.clientY - canvasTransform.y })
      
      // 添加鼠标捕获
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing'
      }
    }
    
    // 关闭连接菜单
    setContextMenuState(null)
  }, [canvasTransform])
  
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      e.preventDefault()
      const newX = e.clientX - panStart.x
      const newY = e.clientY - panStart.y
      
      setCanvasTransform(prev => ({
        ...prev,
        x: newX,
        y: newY
      }))
    }
    
    // 更新连接预览
    if (connectionDrag.isActive) {
      updateConnectionPreview(e)
    }
  }, [isPanning, panStart, connectionDrag.isActive, updateConnectionPreview])
  
  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
    
    // 恢复鼠标样式
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default'
    }
    
    // 取消连接创建
    if (connectionDrag.isActive) {
      cancelConnection()
    }
  }, [connectionDrag.isActive, cancelConnection])

  // 处理触控板手势开始
  const handleGestureStart = useCallback((e: React.TouchEvent) => {
    // 只在Mac系统上处理触控板手势
    if (!isMacTrackpad()) return
    
    // 检查触摸事件是否发生在AI对话节点内部
    const target = e.target as HTMLElement
    const isInAIChatNode = target.closest('.ai-chat-content') || 
                          target.closest('.chat-messages') ||
                          target.closest('.ai-input-card') ||
                          target.closest('.suggestions-panel') ||
                          target.closest('.output-node')
    
    // 如果在AI对话节点内部，不处理画布手势
    if (isInAIChatNode) {
      return
    }
    
    if (e.touches.length >= 2) {
      e.preventDefault()
      setIsTrackpadGesture(true)
      setGestureStartTransform(canvasTransform)
      setLastTouchCount(e.touches.length)
      
      // 计算初始中心点
      if (e.touches.length === 3) {
        const centerX = (e.touches[0].clientX + e.touches[1].clientX + e.touches[2].clientX) / 3
        const centerY = (e.touches[0].clientY + e.touches[1].clientY + e.touches[2].clientY) / 3
        setGestureStartCenter({ x: centerX, y: centerY })
      } else if (e.touches.length === 2) {
        const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2
        setGestureStartCenter({ x: centerX, y: centerY })
        
        // 计算初始距离
        const distance = Math.sqrt(
          Math.pow(e.touches[1].clientX - e.touches[0].clientX, 2) + 
          Math.pow(e.touches[1].clientY - e.touches[0].clientY, 2)
        )
        setInitialDistance(distance)
      }
    }
  }, [canvasTransform, isMacTrackpad])

  // 处理触控板手势变化
  const handleGestureChange = useCallback((e: React.TouchEvent) => {
    // 只在Mac系统上处理触控板手势
    if (!isMacTrackpad()) return
    if (!isTrackpadGesture || e.touches.length < 2) return
    
    // 检查触摸事件是否发生在AI对话节点内部
    const target = e.target as HTMLElement
    const isInAIChatNode = target.closest('.ai-chat-content') || 
                          target.closest('.chat-messages') ||
                          target.closest('.ai-input-card') ||
                          target.closest('.suggestions-panel') ||
                          target.closest('.output-node')
    
    // 如果在AI对话节点内部，不处理画布手势
    if (isInAIChatNode) {
      return
    }
    
    e.preventDefault()
    
    // 三指拖拽
    if (e.touches.length === 3) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const touch3 = e.touches[2]
      
      const currentCenterX = (touch1.clientX + touch2.clientX + touch3.clientX) / 3
      const currentCenterY = (touch1.clientY + touch2.clientY + touch3.clientY) / 3
      
      // 计算相对于手势开始时的位移
      const deltaX = currentCenterX - gestureStartCenter.x
      const deltaY = currentCenterY - gestureStartCenter.y
      
      setCanvasTransform(prev => ({
        ...prev,
        x: gestureStartTransform.x + deltaX,
        y: gestureStartTransform.y + deltaY
      }))
    }
    // 双指缩放
    else if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      
      const currentDistance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      // 计算缩放比例
      const scaleRatio = currentDistance / initialDistance
      const newScale = Math.min(Math.max(gestureStartTransform.scale * scaleRatio, 0.1), 3)
      
      // 计算缩放中心点
      const currentCenterX = (touch1.clientX + touch2.clientX) / 2
      const currentCenterY = (touch1.clientY + touch2.clientY) / 2
      
      // 以手势中心点为缩放中心
      const scaleDiff = newScale - gestureStartTransform.scale
      const offsetX = -(currentCenterX * scaleDiff)
      const offsetY = -(currentCenterY * scaleDiff)
      
      setCanvasTransform(prev => ({
        x: gestureStartTransform.x + offsetX,
        y: gestureStartTransform.y + offsetY,
        scale: newScale
      }))
    }
  }, [isTrackpadGesture, gestureStartTransform, gestureStartCenter, initialDistance, isMacTrackpad])

  // 处理触控板手势结束
  const handleGestureEnd = useCallback(() => {
    setIsTrackpadGesture(false)
    setLastTouchCount(0)
    setGestureStartCenter({ x: 0, y: 0 })
    setInitialDistance(0)
  }, [])

  // 处理Safari的gesture事件（防止网页缩放）
  const handleSafariGesture = useCallback((e: any) => {
    // 阻止Safari默认的手势缩放
    e.preventDefault()
    
    // 检查是否在AI对话节点内部
    const target = e.target as HTMLElement
    const isInAIChatNode = target.closest('.ai-chat-content') || 
                          target.closest('.chat-messages') ||
                          target.closest('.ai-input-card') ||
                          target.closest('.suggestions-panel') ||
                          target.closest('.output-node')
    
    // 如果在AI对话节点内部，不处理画布缩放
    if (isInAIChatNode) {
      return
    }
    
    // 处理画布缩放
    if (e.scale && e.scale !== 1) {
      const rect = canvasRef.current?.getBoundingClientRect()
      if (!rect) return
      
      // 计算手势中心点
      const centerX = (e.clientX || rect.width / 2) - rect.left
      const centerY = (e.clientY || rect.height / 2) - rect.top
      
      // 计算新的缩放比例
      const newScale = Math.min(Math.max(canvasTransform.scale * e.scale, 0.1), 3)
      
      // 计算缩放后的偏移量
      const scaleDiff = newScale - canvasTransform.scale
      const offsetX = -(centerX * scaleDiff)
      const offsetY = -(centerY * scaleDiff)
      
      setCanvasTransform(prev => ({
        x: prev.x + offsetX,
        y: prev.y + offsetY,
        scale: newScale
      }))
    }
  }, [canvasTransform])

  // 绑定Safari gesture事件
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 阻止默认的手势事件
    const preventGesture = (e: any) => {
      e.preventDefault()
    }

    canvas.addEventListener('gesturestart', preventGesture, { passive: false })
    canvas.addEventListener('gesturechange', handleSafariGesture, { passive: false })
    canvas.addEventListener('gestureend', preventGesture, { passive: false })

    return () => {
      canvas.removeEventListener('gesturestart', preventGesture)
      canvas.removeEventListener('gesturechange', handleSafariGesture)
      canvas.removeEventListener('gestureend', preventGesture)
    }
  }, [handleSafariGesture])

  // 防止全局的双指缩放
  useEffect(() => {
    const preventZoom = (e: WheelEvent) => {
      // 只在画布区域内阻止默认缩放
      const target = e.target as HTMLElement
      const isInCanvas = canvasRef.current?.contains(target)
      
      if (isInCanvas && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
      }
    }

    // 在捕获阶段监听，确保能阻止默认行为
    document.addEventListener('wheel', preventZoom, { passive: false, capture: true })

    return () => {
      document.removeEventListener('wheel', preventZoom, { capture: true })
    }
  }, [])
  
  // 缩放控制函数
  const handleZoom = useCallback((factor: number) => {
    setCanvasTransform(prev => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * factor, 0.1), 3)
    }))
  }, [])

  const handleZoomIn = useCallback(() => {
    setCanvasTransform(prev => ({
      ...prev,
      scale: Math.min(prev.scale + 0.2, 3)
    }))
  }, [])
  
  const handleZoomOut = useCallback(() => {
    setCanvasTransform(prev => ({
      ...prev,
      scale: Math.max(prev.scale - 0.2, 0.1)
    }))
  }, [])
  
  const handleZoomReset = useCallback(() => {
    setCanvasTransform({ x: 0, y: 0, scale: 1 })
  }, [])
  
  const handleFitToScreen = useCallback(() => {
    if (!canvasRef.current) return
    
    // 计算所有元素的边界
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
    let hasElements = false
    
    // 计算卡片边界
    cards.forEach(card => {
      hasElements = true
      minX = Math.min(minX, card.position.x)
      minY = Math.min(minY, card.position.y)
      maxX = Math.max(maxX, card.position.x + CARD_SIZES[card.size].width)
      maxY = Math.max(maxY, card.position.y + CARD_SIZES[card.size].height)
    })
    
    // 计算问题节点边界
    questionNodes.forEach(node => {
      const pos = questionPositions.get(node.id)
      if (pos) {
        hasElements = true
        minX = Math.min(minX, pos.x)
        minY = Math.min(minY, pos.y)
        maxX = Math.max(maxX, pos.x + CANVAS_CONSTANTS.QUESTION_NODE_WIDTH)
        maxY = Math.max(maxY, pos.y + CANVAS_CONSTANTS.QUESTION_NODE_HEIGHT)
      }
    })
    
    // 计算输出节点边界
    Object.values(outputNodes).forEach(node => {
      hasElements = true
      minX = Math.min(minX, node.position.x)
      minY = Math.min(minY, node.position.y)
      maxX = Math.max(maxX, node.position.x + 500) // 假设输出节点宽度
      maxY = Math.max(maxY, node.position.y + 400) // 假设输出节点高度
    })
    
    if (!hasElements) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const padding = 50
    
    const contentWidth = maxX - minX + padding * 2
    const contentHeight = maxY - minY + padding * 2
    
    const scaleX = rect.width / contentWidth
    const scaleY = rect.height / contentHeight
    const scale = Math.min(Math.min(scaleX, scaleY, 1), 2)
    
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    
    setCanvasTransform({
      x: rect.width / 2 - centerX * scale,
      y: rect.height / 2 - centerY * scale,
      scale
    })
  }, [cards, questionNodes, questionPositions, outputNodes])

  // 空格键状态处理（键盘Hook中的isSpacePressed需要与这里的平移状态同步）
  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsPanning(false)
      }
    }
    
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // 使用键盘快捷键Hook
  const { isSpacePressed } = useCanvasKeyboardShortcuts({
    selectedCardIds,
    cards,
    onRemoveCard: removeCard,
    onSelectCard: selectCard,
    onClearSelection: clearSelection,
    onZoomIn: () => handleZoom(1.2),
    onZoomOut: () => handleZoom(0.8),
    onZoomReset: handleZoomReset,
    onFitToScreen: handleFitToScreen,
    onToggleAIInput: aiInputVisible ? hideAIInput : showAIInput
  })

  // 从侧边栏选择笔记时自动添加到画布
  useEffect(() => {
    if (selectedNote && !cards.some(card => card.noteId === selectedNote.id)) {
      // 如果画布为空，放在中心；否则放在右侧
      const position = cards.length === 0
        ? { x: 400, y: 200 }
        : {
            x: Math.max(...cards.map(c => c.position.x)) + 300,
            y: 200
          }
      
      addCard({
        noteId: selectedNote.id,
        position: getSmartPosition(position)
      })
    }
  }, [selectedNote, cards, addCard, getSmartPosition])

  return (
    <div className="canvas-area-container">
      <div
        ref={canvasRef}
        className={`canvas-area ${isDraggingOver ? 'dragging-over' : ''} ${isPanning ? 'panning' : ''} ${isSpacePressed ? 'space-pressed' : ''} ${isTrackpadGesture ? 'trackpad-gesture' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onTouchStart={handleGestureStart}
        onTouchMove={handleGestureChange}
        onTouchEnd={handleGestureEnd}
        onTouchCancel={handleGestureEnd}
      >
        {/* 画布网格背景 */}
        <div 
          className="canvas-grid"
          style={{
            transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`,
            transformOrigin: '0 0'
          }}
        />
        
        {/* 画布内容容器 */}
        <div 
          className="canvas-content"
          style={{
            transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`,
            transformOrigin: '0 0'
          }}
        >
        {/* AI输入框功能已集成到 CanvasEmptyState 中 */}

        {/* 连接线层 */}
        <ConnectionLayer
          connections={connections}
          outputConnections={outputConnections}
          cards={cards}
          outputNodes={Object.values(outputNodes)}
          onConnectionClick={handleConnectionClick}
          onConnectionHover={handleConnectionHover}
          onConnectionDoubleClick={handleConnectionDoubleClick}
          onConnectionRightClick={handleConnectionRightClick}
          selectedConnectionId={selectedConnectionId}
        />

        {/* 问题节点 */}
        {questionNodes.map(questionNode => {
          const position = questionPositions.get(questionNode.id) || { x: 400, y: 300 }
          return (
            <QuestionNode
              key={questionNode.id}
              data={questionNode}
              position={position}
              isSelected={activeQuestionId === questionNode.id}
              onPositionChange={(newPos) => handleQuestionPositionChange(questionNode.id, newPos)}
              onEdit={(newQuestion) => {
                updateQuestionNode(questionNode.id, { question: newQuestion })
              }}
              onDelete={() => handleQuestionDelete(questionNode.id)}
              onRetry={() => {
                if (questionNode.status === 'error') {
                  handleQuestionSubmit(questionNode.question)
                }
              }}
              onToggleExpand={() => {
                // 处理展开/收起
              }}
              onNoteClick={handleNoteClick}
            />
          )
        })}

        {/* 空状态提示已移到外部统一处理 */}

        {/* 画布卡片 */}
        {cards.map(card => {
          const connectionStatus = getConnectionPointsStatus(card.id)
          return (
            <CanvasCard
              key={card.id}
              card={card}
              isSelected={selectedCardIds.includes(card.id)}
              knowledgeBaseMap={knowledgeBaseMap}
              onSelect={(isMulti) => handleCardSelect(card.id, isMulti)}
              onPositionChange={(position) => handleCardPositionChange(card.id, position)}
              onSizeChange={(size) => handleCardSizeChange(card.id, size)}
              onRemove={() => handleCardRemove(card.id)}
              hasConnections={connectionStatus.hasConnections}
              onConnectionStart={handleConnectionStart}
              onConnectionPointClick={handleConnectionPointClick}
              showConnectionPoints={connectionDrag.isActive}
            />
          )
        })}

        {/* 输出节点渲染 */}
        {Object.values(outputNodes).map(node => {
          if (node.type === 'ai-chat') {
            const chatNode = node as AIChatNode
            return (
              <AIChatOutputNode
                key={node.id}
                node={chatNode}
                isActive={activeOutputNodeId === node.id}
                onPositionChange={(position) => updateOutputNode(node.id, { position })}
                onRemove={() => removeOutputNode(node.id)}
                onQuestionSubmit={(question) => handleOutputNodeFollowUp(node.id, question)}
              />
            )
          }
          
          if (node.type === 'svg-card') {
            const svgNode = node as SVGCardNode
            return (
              <SVGCardOutputNode
                key={node.id}
                node={svgNode}
                isActive={activeOutputNodeId === node.id}
                onPositionChange={(position) => updateOutputNode(node.id, { position })}
                onRemove={() => removeOutputNode(node.id)}
                onCardDrop={(cardIds) => handleSVGCardGeneration(node.id, cardIds)}
                onTemplateChange={(template) => handleSVGTemplateChange(node.id, template)}
                onRegenerate={() => handleSVGRegenerate(node.id)}
              />
            )
          }
          
          return null
        })}

        {/* 放置指示器 */}
        </div>{/* 结束 canvas-content */}
      </div>

      {/* 新的组件 */}
      <DropIndicator 
        position={dropIndicatorPos}
        isVisible={isDraggingOver}
      />
      
      {/* 连接预览 */}
      {connectionDrag.isActive && connectionDrag.previewLine && (
        <ConnectionPreview
          startPoint={connectionDrag.previewLine.start}
          endPoint={connectionDrag.previewLine.end}
          isVisible={true}
        />
      )}
      
      {/* 连接右键菜单 */}
      {contextMenuState && (
        <ConnectionContextMenu
          isVisible={contextMenuState.isVisible}
          position={contextMenuState.position}
          connectionId={contextMenuState.connectionId}
          currentStatus={contextMenuState.status}
          onStatusChange={handleConnectionStatusChange}
          onDelete={handleConnectionDelete}
          onClose={handleCloseContextMenu}
        />
      )}
      
      {/* 连接悬停信息卡片 */}
      {hoveredConnectionId && hoverCardPosition && (
        (() => {
          const connections = getNodeConnections()
          const connection = connections.find(conn => conn.id === hoveredConnectionId)
          
          if (!connection) return null
          
          return (
            <ConnectionHoverCard
              connection={connection}
              position={hoverCardPosition}
              onClose={() => setHoveredConnectionId(null)}
              onDisconnect={() => {
                deleteConnection(hoveredConnectionId)
                setHoveredConnectionId(null)
              }}
              onStatusChange={(status) => {
                updateOutputConnection(hoveredConnectionId, status)
              }}
            />
          )
        })()
      )}
      
      {/* 连接快捷键帮助 */}
      <ConnectionShortcutsHelp
        selectedConnectionId={selectedConnectionId}
      />

      <CanvasToolbar
        transform={canvasTransform}
        nodeCount={questionNodes.length}
        cardCount={cards.length}
        connectionCount={connections.length}
        svgNodeCount={svgNodes.length}
        isAIInputVisible={aiInputVisible}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onFitToScreen={handleFitToScreen}
        onToggleAIInput={aiInputVisible ? hideAIInput : showAIInput}
        onBatchExport={handleBatchExport}
      />

      <CanvasEmptyState
        isVisible={cards.length === 0 && questionNodes.length === 0 && Object.keys(outputNodes).length === 0 && !isProcessingQuestion}
        onStartThinking={showAIInput}
        onQuestionSubmit={handleOutputNodeQuestionSubmit}
        isProcessing={isProcessingQuestion}
      />

      {/* 批量导出对话框 */}
      <SVGBatchExportDialog
        isOpen={batchExportDialogOpen}
        svgNodes={svgNodes}
        onClose={() => setBatchExportDialogOpen(false)}
      />

      <style jsx>{`
        .canvas-area-container {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          background: #fafbfc;
        }

        .canvas-area {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          cursor: default;
          transition: background-color 0.2s;
          /* 防止浏览器默认缩放 */
          touch-action: none;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }

        .canvas-area.dragging-over {
          background-color: rgba(59, 130, 246, 0.02);
        }

        .canvas-area.panning {
          cursor: grabbing !important;
        }

        .canvas-area.space-pressed {
          cursor: grab;
        }
        
        .canvas-area.space-pressed:active {
          cursor: grabbing;
        }

        .canvas-area.trackpad-gesture {
          cursor: move;
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          touch-action: none;
        }

        .canvas-grid {
          position: absolute;
          top: -5000px;
          left: -5000px;
          width: 10000px;
          height: 10000px;
          background-image: 
            linear-gradient(to right, rgba(0, 0, 0, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
          pointer-events: none;
          opacity: 0.6;
          transition: opacity 0.2s ease;
        }

        .canvas-area.panning .canvas-grid {
          opacity: 0.8;
        }

        .canvas-content {
          width: 10000px;
          height: 10000px;
          position: relative;
          transition: transform 0.1s ease-out;
          will-change: transform;
          transform-origin: 0 0;
          min-width: 100%;
          min-height: 100%;
        }


        /* 空状态 */
        .empty-state {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: #6b7280;
          user-select: none;
        }

        .empty-icon {
          width: 80px;
          height: 80px;
          margin: 0 auto 20px;
          background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          color: #6366f1;
        }

        .empty-state h3 {
          font-size: 20px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 8px;
        }

        .empty-state p {
          font-size: 14px;
          margin-bottom: 24px;
        }

        .tips {
          display: flex;
          gap: 24px;
          justify-content: center;
        }

        .tip {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: #9ca3af;
        }

        .tip i {
          font-size: 14px;
        }



        .start-thinking-btn {
          margin-top: 16px;
          padding: 12px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
        }

        .start-thinking-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }


        /* 滚动条样式 */
        .canvas-area::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .canvas-area::-webkit-scrollbar-track {
          background: transparent;
        }

        .canvas-area::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 4px;
        }

        .canvas-area::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        /* 响应式 */
        @media (max-width: 768px) {
          .tips {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  )
}