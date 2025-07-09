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
    
    console.log('📚 [DEBUG] 创建 knowledgeBase 索引:', {
      originalSize: knowledgeBase.length,
      localSize: localKnowledgeBase.length,
      mapSize: map.size,
      sampleIds: Array.from(map.keys()).slice(0, 5)
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

    console.log('🤔 处理用户问题:', question)
    setIsProcessingQuestion(true)

    try {
      // 1. 创建问题节点 - 使用输入框位置或默认中心位置
      const questionPosition = inputPosition || { x: 400, y: 300 }
      console.log('📍 问题节点位置:', questionPosition)
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
                  console.log('📚 [前端] 收到相关笔记:', {
                    notesCount: relatedNotes.length,
                    notesList: relatedNotes.map((note: any) => ({
                      id: note.id,
                      title: note.title
                    })),
                    timestamp: new Date().toISOString()
                  })
                } else if (data.type === 'complete') {
                  console.log('🎯 [前端] 收到完成事件，准备布局:', {
                    questionId,
                    answerLength: answer.length,
                    relatedNotesCount: relatedNotes.length,
                    timestamp: new Date().toISOString()
                  })
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

    console.log('🎯 [输出节点] 处理用户问题:', question)
    setIsProcessingQuestion(true)

    try {
      // 1. 创建AI对话输出节点
      const nodePosition = inputPosition || { x: 400, y: 300 }
      const nodeId = createOutputNode({
        type: 'ai-chat',
        position: nodePosition,
        initialQuestion: question
      })

      console.log('🎯 [输出节点] 创建节点:', { nodeId, position: nodePosition })

      // 更新节点状态为召回中
      updateOutputNode(nodeId, { status: 'recalling' })

      // 2. 调用新的输出节点API
      console.log('📡 [输出节点] 准备发送API请求:', {
        question: question.slice(0, 100),
        knowledgeBaseSize: knowledgeBase.length,
        knowledgeBaseSample: knowledgeBase.slice(0, 3).map(note => ({
          id: note.id,
          title: note.title
        })),
        nodeId,
        nodeType: 'ai-chat'
      })
      
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
          console.log('🔍 [SSE块] 接收到数据块:', chunk)
          const lines = chunk.split('\n')
          console.log('🔍 [SSE行] 分割后的行数:', lines.length, lines)

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                console.log('🔍 [SSE解析] 原始数据行:', line)
                const data = JSON.parse(line.slice(6))
                console.log('📨 [输出节点] 收到数据:', data.type, data)

                if (data.type === 'status') {
                  updateOutputNode(nodeId, { status: data.data.status })
                } else if (data.type === 'recalled_cards') {
                  recalledCards = data.data.cards || []
                  console.log('\n🔥🔥🔥 [前端收到] 召回卡片事件详情:')
                  console.log('   - 卡片数量:', recalledCards.length)
                  console.log('   - 卡片ID列表:', recalledCards.map(c => c.id))
                  console.log('   - 卡片标题列表:', recalledCards.map(c => c.title))
                  console.log('   - 当前节点ID:', nodeId)
                  console.log('   - 原始数据:', data.data)
                  console.log('🔥🔥🔥\n')
                  
                  // 验证数据完整性
                  if (recalledCards.length > 0) {
                    console.log('✅ [输出节点] 召回卡片验证通过，调用handleRecalledCards')
                    handleRecalledCards(nodeId, recalledCards)
                  } else {
                    console.log('⚠️ [输出节点] 召回卡片为空，跳过处理')
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

                  console.log('✅ [输出节点] 处理完成')
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
    console.log('🎯 [通用接口] addCardById 被调用:', { noteId, position })
    
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
    
    console.log(`✅ [通用接口] 准备添加卡片:`, {
      noteId,
      noteTitle: note.title,
      position: finalPosition,
      currentCardsCount: cards.length
    })
    
    // 5. 调用原始的 addCard 接口（手动拖拽使用的同一个）
    addCard({
      noteId,
      position: finalPosition
    })
    
    console.log(`✅ [通用接口] addCard 调用完成`)
    return true
  }, [knowledgeBase, cards, getSmartPosition, addCard])

  // 处理召回的卡片
  const handleRecalledCards = useCallback(async (nodeId: string, recalledCards: any[]) => {
    console.log('\n🌟🌟🌟 [handleRecalledCards] 函数被调用:')
    console.log('   - 节点ID:', nodeId)
    console.log('   - 卡片数量:', recalledCards.length)
    console.log('   - 卡片列表:', recalledCards.map(c => ({ id: c.id, title: c.title })))
    console.log('🌟🌟🌟\n')
    
    if (!recalledCards.length) {
      console.log('⚠️ [召回处理] 无卡片需要添加')
      return
    }

    console.log('🃏 [召回处理] 开始添加卡片到画布:', {
      nodeId,
      recalledCardsCount: recalledCards.length,
      recalledCards: recalledCards.map(c => ({ id: c.id, title: c.title })),
      knowledgeBaseSize: knowledgeBase.length,
      localKnowledgeBaseSize: localKnowledgeBase.length
    })
    
    // 🔥 关键检查：召回的卡片是否在原始 knowledgeBase 中
    console.log('🔍 [召回处理] 检查召回卡片在原始知识库中的存在状态:')
    recalledCards.forEach(card => {
      const existsInOriginal = knowledgeBase.find(note => note.id === card.id)
      console.log(`  - ${card.id}: ${existsInOriginal ? '✅ 存在于原始知识库' : '❌ 不存在于原始知识库'}`)
      if (existsInOriginal) {
        console.log(`    标题: ${existsInOriginal.title}`)
      }
    })

    // 🔥 使用通用接口：直接根据 noteId 添加卡片
    console.log('🔥 [召回处理] 使用通用 addCardById 接口')
    
    // 🔥 简化逻辑：使用通用接口逐个添加召回的卡片
    let addedCount = 0
    
    for (let i = 0; i < recalledCards.length; i++) {
      const card = recalledCards[i]
      console.log(`🎯 [召回处理] 尝试添加第${i + 1}张卡片: ${card.id}`)
      
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
    
    console.log(`✅ [召回处理] 添加完成: ${addedCount}/${recalledCards.length} 张卡片成功添加`)
    
    // 更新节点状态
    if (addedCount > 0) {
      updateOutputNode(nodeId, {
        ...{ recalledCards, contextCards: recalledCards } as Partial<AIChatNode>
      })
    }

  }, [outputNodes, addCardById, addOutputConnection, updateOutputNode])

  // 处理输出节点追问
  const handleOutputNodeFollowUp = useCallback(async (nodeId: string, question: string) => {
    console.log('💬 [追问] 处理追问:', { nodeId, question })

    // 获取当前节点的上下文卡片
    const contextCardIds = getNodeContextCards(nodeId)
    const contextCards = contextCardIds
      .map(cardId => knowledgeBaseMap.get(cardId))
      .filter(Boolean)

    // 获取对话历史
    const node = outputNodes[nodeId] as AIChatNode
    const conversationHistory = node?.conversationHistory || []

    console.log('📝 [追问] 上下文:', {
      contextCards: contextCards.length,
      historyMessages: conversationHistory.length
    })

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

                  console.log('✅ [追问] 完成')
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
      console.log('✅ [前端布局] 问题处理完成，开始布局', {
        questionId,
        answerLength: answer.length,
        relatedNotesCount: relatedNotesData.length,
        relatedNotesData,
        startTime: new Date().toISOString()
      })

      // 设置加载状态
      setQuestionNodeStatus(questionId, 'processing')

      // 1. 更新问题节点 - 从最新状态获取
      const currentState = useCanvasStore.getState()
      const questionNode = currentState.questionNodes.find(q => q.id === questionId)
      if (!questionNode) {
        console.error('❌ [DEBUG] 找不到问题节点:', questionId)
        console.log('❌ [DEBUG] 当前问题节点列表:', currentState.questionNodes.map(q => ({ id: q.id, question: q.question })))
        return
      }
      console.log('🔍 [DEBUG] 找到问题节点:', questionNode)

      // 转换为KnowledgeNote格式
      const relatedNotes: KnowledgeNote[] = relatedNotesData.map(noteData => ({
        ...noteData,
        createdAt: new Date(noteData.createdAt || Date.now()),
        updatedAt: new Date(noteData.updatedAt || Date.now()),
        lastAccessed: new Date(),
        saveHistory: []
      }))

      console.log('🔄 [DEBUG] 转换后的相关笔记:', relatedNotes)

      setQuestionNodeAnswer(questionId, answer, relatedNotes)

      // 2. 异步分析关系映射
      console.log('⏳ [DEBUG] 开始异步关系分析...')
      const relationships = await new Promise<any>((resolve) => {
        const executeAnalysis = () => {
          const result = relationshipMapper.current.analyzeQuestionNoteRelationships(
            questionNode,
            relatedNotes
          )
          console.log('🔗 [DEBUG] 关系映射结果:', result)
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
      console.log('⏳ [DEBUG] 开始异步布局计算...')
      const centerPosition = questionPositions.get(questionId) || { x: 400, y: 300 }
      console.log('📍 [DEBUG] 中心位置:', centerPosition)
      
      layoutEngine.current.updateConfig({ centerPosition })
      
      const layoutResult = await new Promise<any>((resolve) => {
        const executeLayout = () => {
          const result = layoutEngine.current.layoutQuestionWithNotes(
            questionNode,
            relatedNotes,
            [] // 暂时不考虑现有节点
          )
          console.log('📐 [DEBUG] 布局结果:', result)
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
      console.log('🎯 [DEBUG] 开始添加笔记卡片到画布')
      console.log('🎯 [DEBUG] 当前画布卡片:', currentState.cards)
      
      // 收集所有需要添加的卡片
      const cardsToAdd: { noteId: string; position: Position }[] = []
      
      for (const layoutNode of layoutResult.nodes) {
        console.log('🔍 [DEBUG] 处理布局节点:', layoutNode)
        
        if (layoutNode.type === 'note') {
          const relatedNote = relatedNotes.find(n => n.id === layoutNode.id)
          console.log('📝 [DEBUG] 查找相关笔记:', {
            layoutNodeId: layoutNode.id,
            foundNote: relatedNote ? '✅ 找到' : '❌ 未找到',
            noteData: relatedNote
          })
          
          const existingCard = currentState.cards.some(c => c.noteId === layoutNode.id)
          console.log('🔍 [DEBUG] 检查是否已存在卡片:', {
            noteId: layoutNode.id,
            exists: existingCard,
            currentCards: currentState.cards.map(c => ({ id: c.id, noteId: c.noteId }))
          })
          
          if (relatedNote && !existingCard) {
            console.log('➕ [DEBUG] 准备添加卡片:', {
              noteId: layoutNode.id,
              position: layoutNode.position
            })
            
            cardsToAdd.push({
              noteId: layoutNode.id,
              position: layoutNode.position
            })
          } else {
            console.log('⚠️ [DEBUG] 跳过添加卡片:', {
              reason: !relatedNote ? '找不到笔记' : '卡片已存在'
            })
          }
        } else if (layoutNode.type === 'question') {
          console.log('❓ [DEBUG] 更新问题节点位置:', layoutNode.position)
          // 更新问题节点位置
          setQuestionPositions(prev => new Map(prev.set(questionId, layoutNode.position)))
        }
      }
      
      // 批量添加所有卡片，避免多次重渲染
      if (cardsToAdd.length > 0) {
        console.log('🎯 [DEBUG] 批量添加卡片:', {
          cardsCount: cardsToAdd.length,
          cards: cardsToAdd
        })
        
        addCards(cardsToAdd)
        
        console.log('✅ [DEBUG] 批量添加卡片完成')
      } else {
        console.log('⚠️ [DEBUG] 没有卡片需要添加')
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
      
      console.log('🎯 [前端布局] 智能布局完成:', {
        questionId,
        notesAdded: relatedNotes.length,
        connectionsAdded: connectionData.length,
        layoutDuration: `${layoutDuration.toFixed(2)}ms`,
        endTime: new Date().toISOString()
      })

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
      console.log('点击笔记:', note.title)
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

  // 处理放置
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    setDropIndicatorPos(null)
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'))
      
      if (dragData.type !== 'note') return
      
      // 检查是否已存在
      if (cards.some(card => card.noteId === dragData.noteId)) {
        console.warn('该笔记已在画布中')
        return
      }
      
      // 检查数量限制
      if (cards.length >= CANVAS_CONSTANTS.MAX_CARDS) {
        console.error('画布已达到最大卡片数量限制')
        return
      }
      
      if (!canvasRef.current) return
      
      const rect = canvasRef.current.getBoundingClientRect()
      const dropPosition = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
      
      // 获取智能位置
      const finalPosition = getSmartPosition(dropPosition)
      
      // 添加卡片
      addCard({
        noteId: dragData.noteId,
        position: finalPosition
      })
    } catch (error) {
      console.error('Failed to parse drag data:', error)
    }
  }, [cards, addCard, getSmartPosition])

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
            console.log('点击连接线:', connectionId)
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
        {(() => {
          console.log('🖼️ [DEBUG] 渲染画布卡片:', {
            cardsCount: cards.length,
            cards: cards.map(c => ({ id: c.id, noteId: c.noteId, position: c.position })),
            knowledgeBaseSize: knowledgeBase.length,
            outputNodesCount: Object.keys(outputNodes).length,
            outputConnectionsCount: outputConnections.length
          })
          return null
        })()}
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