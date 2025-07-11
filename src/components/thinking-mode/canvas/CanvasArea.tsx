'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { CanvasCard } from './CanvasCard'
import { CanvasAIInput } from './CanvasAIInput'
import { QuestionNode, QuestionNodeData } from './QuestionNode'
import { ConnectionLayer } from './ConnectionLine'
import { AIChatOutputNode } from './AIChatOutputNode'
import { useCanvasStore } from './canvasStore'
import { KnowledgeNote } from '@/types/knowledge'
import { Position, CanvasCard as CanvasCardType, CANVAS_CONSTANTS, CARD_SIZES } from '@/types/canvas'
import type { AIChatNode } from '@/types/outputNode'
import { ConnectionStatus } from '@/types/outputNode'
import { createLayoutEngine } from '@/utils/canvasLayout'
import { createRelationshipMapper } from '@/utils/relationshipMapping'
import type { ExtendedDragData } from '@/types/nodeTypes'
import { getNodeTypeById } from '@/constants/nodeTypes'

interface CanvasAreaProps {
  selectedNote?: KnowledgeNote | null
  knowledgeBase?: KnowledgeNote[]
}

export function CanvasArea({ selectedNote, knowledgeBase = [] }: CanvasAreaProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [dropIndicatorPos, setDropIndicatorPos] = useState<Position | null>(null)
  const [isProcessingQuestion, setIsProcessingQuestion] = useState(false)
  const [questionPositions, setQuestionPositions] = useState<Map<string, Position>>(new Map())
  
  // 画布缩放和平移状态
  const [canvasTransform, setCanvasTransform] = useState({ x: 0, y: 0, scale: 1 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const [isSpacePressed, setIsSpacePressed] = useState(false)
  
  // 创建一个本地的知识库管理
  const [localKnowledgeBase, setLocalKnowledgeBase] = useState<KnowledgeNote[]>([])
  
  // 更新本地知识库
  useEffect(() => {
    setLocalKnowledgeBase(knowledgeBase)
  }, [knowledgeBase])
  
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
    getNodeContextCards
  } = useCanvasStore()
  
  // 创建布局引擎和关系映射器
  const layoutEngine = useRef(createLayoutEngine())
  const relationshipMapper = useRef(createRelationshipMapper())

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

  // 处理输出节点问题提交 - 新的双阶段处理流程
  const handleOutputNodeQuestionSubmit = useCallback(async (question: string, inputPosition?: Position) => {
    if (isProcessingQuestion) return

    setIsProcessingQuestion(true)

    try {
      // 1. 创建AI对话输出节点
      const nodePosition = inputPosition || { x: 400, y: 300 }
      const nodeId = createOutputNode({
        type: 'ai-chat',
        position: nodePosition,
        initialQuestion: question
      })


      // 更新节点状态为召回中
      updateOutputNode(nodeId, { status: 'recalling' })

      // 2. 调用新的输出节点API
      
      const response = await fetch('/api/output-node-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          knowledgeBase: knowledgeBase.slice(0, 50),
          nodeId,
          nodeType: 'ai-chat'
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      if (!response.body) {
        throw new Error('响应体为空')
      }

      // 3. 处理流式响应
      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      let answer = ''
      let recalledCards: any[] = []

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

                if (data.type === 'status') {
                  updateOutputNode(nodeId, { status: data.data.status })
                } else if (data.type === 'recalled_cards') {
                  recalledCards = data.data.cards || []
                  
                  // 验证数据完整性
                  if (recalledCards.length > 0) {
                    handleRecalledCards(nodeId, recalledCards)
                  } else {
                  }
                } else if (data.type === 'answer_content') {
                  answer += data.data.content
                  // 更新节点的当前回答
                  updateOutputNode(nodeId, { 
                    ...{ currentAnswer: answer } as Partial<AIChatNode>,
                    status: 'generating'
                  })
                } else if (data.type === 'complete') {
                  // 完成处理
                  updateOutputNode(nodeId, { 
                    status: 'completed',
                    ...{ currentAnswer: answer } as Partial<AIChatNode>
                  })
                  
                  // 将问答添加到对话历史
                  addMessageToOutputNode(nodeId, {
                    role: 'user',
                    content: question,
                    contextCards: recalledCards.map(c => c.id)
                  })
                  
                  addMessageToOutputNode(nodeId, {
                    role: 'assistant',
                    content: answer,
                    contextCards: recalledCards.map(c => c.id)
                  })

                }
              } catch (e) {
                console.warn('解析输出节点SSE数据失败:', e)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }

    } catch (error) {
      console.error('❌ [输出节点] 处理失败:', error)
      // 更新节点为错误状态
      const currentNodes = Object.values(outputNodes)
      const latestNode = currentNodes[currentNodes.length - 1]
      if (latestNode) {
        updateOutputNode(latestNode.id, { status: 'error' })
      }
    } finally {
      setIsProcessingQuestion(false)
    }
  }, [isProcessingQuestion, knowledgeBase, createOutputNode, updateOutputNode, addMessageToOutputNode, outputNodes])

  // 🔥 通用接口：根据 noteId 添加卡片到画布
  const addCardById = useCallback((noteId: string, position?: Position) => {
    
    // 1. 验证 noteId 是否存在于知识库
    const note = knowledgeBase.find(n => n.id === noteId)
    if (!note) {
      console.error(`❌ [通用接口] noteId ${noteId} 不存在于知识库中`)
      console.error(`❌ [通用接口] 可用的 noteId:`, knowledgeBase.slice(0, 10).map(n => n.id))
      return false
    }
    
    // 2. 检查是否已存在于画布
    if (cards.some(card => card.noteId === noteId)) {
      console.warn(`⚠️ [通用接口] noteId ${noteId} 已存在于画布中`)
      return false
    }
    
    // 3. 检查数量限制
    if (cards.length >= CANVAS_CONSTANTS.MAX_CARDS) {
      console.error(`❌ [通用接口] 画布已达到最大卡片数量限制 (${CANVAS_CONSTANTS.MAX_CARDS})`)
      return false
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
    addCard({
      noteId,
      position: finalPosition
    })
    
    return true
  }, [knowledgeBase, cards, getSmartPosition, addCard])

  // 处理召回的卡片
  const handleRecalledCards = useCallback(async (nodeId: string, recalledCards: any[]) => {
    
    if (!recalledCards.length) {
      return
    }

    
    // 🔥 关键检查：召回的卡片是否在原始 knowledgeBase 中
    recalledCards.forEach(card => {
      const existsInOriginal = knowledgeBase.find(note => note.id === card.id)
      if (existsInOriginal) {
      }
    })

    // 🔥 使用通用接口：直接根据 noteId 添加卡片
    
    // 🔥 简化逻辑：使用通用接口逐个添加召回的卡片
    let addedCount = 0
    
    for (let i = 0; i < recalledCards.length; i++) {
      const card = recalledCards[i]
      
      // 计算卡片位置（围绕输出节点分布）
      const node = outputNodes[nodeId]
      const centerPosition = node ? node.position : { x: 400, y: 300 }
      
      const angle = (i / recalledCards.length) * 2 * Math.PI
      const radius = 150
      const cardPosition = {
        x: centerPosition.x + Math.cos(angle) * radius,
        y: centerPosition.y + Math.sin(angle) * radius
      }
      
      // 使用通用接口添加卡片
      const success = addCardById(card.id, cardPosition)
      if (success) {
        addedCount++
        
        // 创建连接线
        const connection = {
          fromId: nodeId,
          toId: card.id,
          fromType: 'outputNode' as const,
          toType: 'card' as const,
          status: ConnectionStatus.ACTIVE,
          strength: 1.0
        }
        addOutputConnection(connection)
      }
    }
    
    
    // 更新节点状态
    if (addedCount > 0) {
      updateOutputNode(nodeId, {
        ...{ recalledCards, contextCards: recalledCards } as Partial<AIChatNode>
      })
    }

  }, [outputNodes, addCardById, addOutputConnection, updateOutputNode])

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


    // 更新节点状态
    updateOutputNode(nodeId, { 
      status: 'generating',
      ...{ currentQuestion: question } as Partial<AIChatNode>
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
                  updateOutputNode(nodeId, { ...{ currentAnswer: answer } as Partial<AIChatNode> })
                } else if (data.type === 'complete') {
                  // 添加到对话历史
                  addMessageToOutputNode(nodeId, {
                    role: 'user',
                    content: question,
                    contextCards: contextCardIds
                  })
                  
                  addMessageToOutputNode(nodeId, {
                    role: 'assistant',
                    content: answer,
                    contextCards: contextCardIds
                  })

                  updateOutputNode(nodeId, { 
                    status: 'completed',
                    ...{ currentQuestion: undefined, currentAnswer: undefined } as Partial<AIChatNode>
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

  // 处理拖拽进入
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    
    if (!canvasRef.current) return
    
    const rect = canvasRef.current.getBoundingClientRect()
    const position = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    
    setIsDraggingOver(true)
    
    // 更新放置指示器位置
    const smartPos = getSmartPosition(position)
    setDropIndicatorPos(smartPos)
  }, [getSmartPosition])

  // 处理拖拽离开
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // 确保是离开画布而不是子元素
    if (e.currentTarget === e.target) {
      setIsDraggingOver(false)
      setDropIndicatorPos(null)
    }
  }, [])

  // 处理节点模板放置
  const handleNodeTemplateDrop = useCallback((dragData: ExtendedDragData, position: Position) => {
    const nodeType = getNodeTypeById(dragData.nodeType!)
    if (!nodeType) {
      console.error('未知的节点类型:', dragData.nodeType)
      return
    }

    const nodeId = `${nodeType.id}-${Date.now()}`

    switch (nodeType.id) {
      case 'ai-chat':
        createOutputNode({
          type: 'ai-chat',
          position,
          initialQuestion: dragData.metadata?.title || '',
          config: {
            nodeType: 'ai-chat',
            modelProvider: 'openai',
            modelName: 'gpt-4o-mini',
            systemPrompt: `你是一个专业的知识助手。基于用户提供的知识卡片内容，为用户的问题提供准确、有帮助的回答。

回答要求：
1. 基于提供的知识卡片内容进行回答
2. 保持客观、准确的语调
3. 如果知识卡片中没有相关信息，请诚实说明
4. 提供具体、可操作的建议
5. 适当引用知识卡片中的关键信息`,
            outputFormat: 'text',
            contextStrategy: 'full'
          }
        })
        break
        
      case 'html-page':
        // TODO: 实现HTML页面节点
        break
        
      case 'text-note':
        // TODO: 实现文本笔记节点
        break
        
      case 'image-node':
        // TODO: 实现图片节点
        break
        
      default:
        console.warn('不支持的节点类型:', nodeType.id)
    }
  }, [createOutputNode])

  // 处理放置
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    setDropIndicatorPos(null)
    
    try {
      const dragData: ExtendedDragData = JSON.parse(e.dataTransfer.getData('application/json'))
      
      if (!canvasRef.current) return
      
      const rect = canvasRef.current.getBoundingClientRect()
      const dropPosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      
      // 获取智能位置
      const finalPosition = getSmartPosition(dropPosition)
      
      if (dragData.type === 'node-template') {
        // 处理节点模板拖拽
        handleNodeTemplateDrop(dragData, finalPosition)
      } else if (dragData.type === 'note') {
        // 处理笔记拖拽（现有逻辑）
        // 检查是否已存在
        if (cards.some(card => card.noteId === dragData.id)) {
          console.warn('该笔记已在画布中')
          return
        }
        
        // 检查数量限制
        if (cards.length >= CANVAS_CONSTANTS.MAX_CARDS) {
          console.error('画布已达到最大卡片数量限制')
          return
        }
        
        // 添加卡片
        addCard({
          noteId: dragData.id,
          position: finalPosition
        })
      }
    } catch (error) {
      console.error('Failed to parse drag data:', error)
    }
  }, [cards, addCard, getSmartPosition, handleNodeTemplateDrop])

  // 处理画布点击（取消选择）
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      clearSelection()
    }
  }, [clearSelection])
  
  // 处理画布滚轮缩放
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
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
    }
  }, [canvasTransform])
  
  // 处理画布平移
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    // 空格+左键或中键开始平移
    if ((isSpacePressed && e.button === 0) || e.button === 1) {
      e.preventDefault()
      setIsPanning(true)
      setPanStart({ x: e.clientX - canvasTransform.x, y: e.clientY - canvasTransform.y })
      
      // 添加鼠标捕获
      if (canvasRef.current) {
        canvasRef.current.style.cursor = 'grabbing'
      }
    }
  }, [isSpacePressed, canvasTransform])
  
  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      const newX = e.clientX - panStart.x
      const newY = e.clientY - panStart.y
      
      setCanvasTransform(prev => ({
        ...prev,
        x: newX,
        y: newY
      }))
    }
  }, [isPanning, panStart])
  
  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false)
    
    // 恢复鼠标样式
    if (canvasRef.current) {
      canvasRef.current.style.cursor = isSpacePressed ? 'grab' : 'default'
    }
  }, [isSpacePressed])
  
  // 缩放控制函数
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

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Delete键删除选中的卡片
      if (e.key === 'Delete' && selectedCardIds.length > 0) {
        selectedCardIds.forEach(id => removeCard(id))
      }
      
      // Ctrl/Cmd + A 全选
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        cards.forEach(card => selectCard(card.id, false))
      }
      
      // Escape 取消选择
      if (e.key === 'Escape') {
        clearSelection()
      }
      
      // 空格键激活平移模式
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault()
        setIsSpacePressed(true)
      }
      
      // 快捷键缩放
      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault()
        handleZoomIn()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault()
        handleZoomOut()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault()
        handleZoomReset()
      }
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        setIsSpacePressed(false)
        setIsPanning(false)
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [selectedCardIds, cards, removeCard, selectCard, clearSelection])

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
        className={`canvas-area ${isDraggingOver ? 'dragging-over' : ''} ${isPanning ? 'panning' : ''} ${isSpacePressed ? 'space-pressed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleCanvasClick}
        onWheel={handleWheel}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      >
        {/* 画布内容容器 */}
        <div 
          className="canvas-content"
          style={{
            transform: `translate(${canvasTransform.x}px, ${canvasTransform.y}px) scale(${canvasTransform.scale})`,
            transformOrigin: '0 0'
          }}
        >
        {/* AI输入框 */}
        {aiInputVisible && (
          <CanvasAIInput
            onQuestionSubmit={handleOutputNodeQuestionSubmit}
            isLoading={isProcessingQuestion}
            knowledgeBase={knowledgeBase}
            onClose={() => hideAIInput()}
          />
        )}

        {/* 连接线层 */}
        <ConnectionLayer
          connections={connections}
          outputConnections={outputConnections}
          cards={cards}
          outputNodes={Object.values(outputNodes)}
          onConnectionClick={(connectionId) => {
          }}
          onConnectionHover={(connectionId) => {
            // 处理连接线悬停
          }}
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

        {/* 空状态提示 */}
        {cards.length === 0 && questionNodes.length === 0 && !isDraggingOver && !aiInputVisible && !isProcessingQuestion && (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fas fa-brain"></i>
            </div>
            <h3>智能画布</h3>
            <p>问一个问题，让AI为你召回相关知识卡片</p>
            <button 
              onClick={showAIInput}
              className="start-thinking-btn"
            >
              <i className="fas fa-plus"></i>
              开始思考
            </button>
            <div className="tips">
              <div className="tip">
                <i className="fas fa-comments"></i>
                <span>AI问答助手</span>
              </div>
              <div className="tip">
                <i className="fas fa-project-diagram"></i>
                <span>智能关系映射</span>
              </div>
              <div className="tip">
                <i className="fas fa-magic"></i>
                <span>自动布局优化</span>
              </div>
            </div>
          </div>
        )}

        {/* 画布卡片 */}
        {cards.map(card => (
          <CanvasCard
            key={card.id}
            card={card}
            isSelected={selectedCardIds.includes(card.id)}
            knowledgeBaseMap={knowledgeBaseMap}
            onSelect={(isMulti) => handleCardSelect(card.id, isMulti)}
            onPositionChange={(position) => handleCardPositionChange(card.id, position)}
            onSizeChange={(size) => handleCardSizeChange(card.id, size)}
            onRemove={() => handleCardRemove(card.id)}
          />
        ))}

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
                onContextCardClick={(cardId) => {
                  // 点击上下文卡片时，高亮对应的画布卡片
                  const card = cards.find(c => c.noteId === cardId)
                  if (card) {
                    selectCard(card.id, false)
                  }
                }}
              />
            )
          }
          return null
        })}

        {/* 放置指示器 */}
        {isDraggingOver && dropIndicatorPos && (
          <div
            className="drop-indicator"
            style={{
              left: dropIndicatorPos.x - 140,
              top: dropIndicatorPos.y - 100
            }}
          />
        )}
        </div>{/* 结束 canvas-content */}
      </div>

      {/* 画布工具栏 */}
      <div className="canvas-toolbar">
        <div className="toolbar-section">
          <button 
            className={`toolbar-btn ${aiInputVisible ? 'active' : ''}`}
            title="AI提问"
            onClick={aiInputVisible ? hideAIInput : showAIInput}
          >
            <i className="fas fa-robot"></i>
          </button>
          <button 
            className="toolbar-btn" 
            title="适应画布 (F)"
            onClick={handleFitToScreen}
          >
            <i className="fas fa-compress"></i>
          </button>
          <button 
            className="toolbar-btn" 
            title="重置缩放 (Ctrl+0)"
            onClick={handleZoomReset}
          >
            <i className="fas fa-undo"></i>
          </button>
          <button 
            className="toolbar-btn" 
            title="放大 (Ctrl++)" 
            onClick={handleZoomIn}
            disabled={canvasTransform.scale >= 3}
          >
            <i className="fas fa-search-plus"></i>
          </button>
          <button 
            className="toolbar-btn" 
            title="缩小 (Ctrl+-)" 
            onClick={handleZoomOut}
            disabled={canvasTransform.scale <= 0.1}
          >
            <i className="fas fa-search-minus"></i>
          </button>
          <span className="zoom-indicator">
            {Math.round(canvasTransform.scale * 100)}%
          </span>
        </div>
        <div className="toolbar-section">
          <span className="node-count">
            {questionNodes.length} 问题 | {cards.length} 笔记
          </span>
          {connections.length > 0 && (
            <span className="connection-count">
              {connections.length} 连接
            </span>
          )}
        </div>
      </div>

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

        .canvas-content {
          width: 100%;
          height: 100%;
          position: relative;
          transition: transform 0.1s ease-out;
          will-change: transform;
          transform-origin: 0 0;
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

        /* 放置指示器 */
        .drop-indicator {
          position: absolute;
          width: 280px;
          height: 200px;
          border: 2px dashed #3b82f6;
          border-radius: 12px;
          background: rgba(59, 130, 246, 0.05);
          pointer-events: none;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        /* 工具栏 */
        .canvas-toolbar {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 16px;
          z-index: 10;
        }

        .toolbar-section {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toolbar-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: transparent;
          color: #6b7280;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .toolbar-btn:hover:not(:disabled) {
          background: #f3f4f6;
          color: #374151;
        }

        .toolbar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .zoom-indicator {
          font-size: 12px;
          color: #6b7280;
          font-weight: 500;
          padding: 0 8px;
          border-left: 1px solid rgba(156, 163, 175, 0.3);
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

        .toolbar-btn.active {
          background: #667eea;
          color: white;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }

        .node-count,
        .connection-count {
          font-size: 12px;
          color: #9ca3af;
          white-space: nowrap;
        }

        .connection-count {
          margin-left: 8px;
          padding-left: 8px;
          border-left: 1px solid rgba(156, 163, 175, 0.3);
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
          .canvas-toolbar {
            bottom: 10px;
            right: 10px;
            padding: 6px 12px;
          }

          .toolbar-btn {
            width: 28px;
            height: 28px;
            font-size: 14px;
          }

          .tips {
            flex-direction: column;
            gap: 12px;
          }
        }
      `}</style>
    </div>
  )
}