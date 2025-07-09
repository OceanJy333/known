import { create } from 'zustand'
import { 
  CanvasState, 
  CanvasCard, 
  Position, 
  CANVAS_CONSTANTS,
  CARD_SIZES
} from '@/types/canvas'
import { QuestionNodeData } from './QuestionNode'
import { ConnectionData } from './ConnectionLine'
import { 
  BaseOutputNode, 
  AIChatNode, 
  OutputNodeConnection, 
  CreateNodeParams, 
  ConversationMessage,
  ConnectionStatus,
  NODE_CONFIGS
} from '@/types/outputNode'

// 扩展画布状态以支持问题节点、连接线和输出节点
interface ExtendedCanvasState extends CanvasState {
  questionNodes: QuestionNodeData[]
  connections: ConnectionData[]
  aiInputVisible: boolean
  activeQuestionId: string | null
  
  // 输出节点相关状态
  outputNodes: Record<string, BaseOutputNode>
  outputConnections: OutputNodeConnection[]
  activeOutputNodeId: string | null
}

interface CanvasStore extends ExtendedCanvasState {
  // 卡片操作方法
  addCard: (params: { noteId: string; position: Position }) => void
  addCards: (cards: { noteId: string; position: Position }[]) => void
  updateCard: (id: string, updates: Partial<CanvasCard>) => void
  removeCard: (id: string) => void
  selectCard: (id: string, isMulti: boolean) => void
  clearSelection: () => void
  
  // 问题节点操作方法
  addQuestionNode: (question: string, position: Position) => string
  updateQuestionNode: (id: string, updates: Partial<QuestionNodeData>) => void
  removeQuestionNode: (id: string) => void
  setQuestionNodeAnswer: (id: string, answer: string, relatedNotes: any[]) => void
  setQuestionNodeStatus: (id: string, status: QuestionNodeData['status']) => void
  
  // AI输入框控制
  showAIInput: () => void
  hideAIInput: () => void
  setActiveQuestion: (id: string | null) => void
  
  // 连接线操作方法
  addConnection: (connection: Omit<ConnectionData, 'id'>) => void
  removeConnection: (id: string) => void
  updateConnection: (id: string, updates: Partial<ConnectionData>) => void
  removeConnectionsByNodeId: (nodeId: string) => void
  
  // 输出节点操作方法
  createOutputNode: (params: CreateNodeParams) => string
  updateOutputNode: (nodeId: string, updates: Partial<BaseOutputNode>) => void
  removeOutputNode: (nodeId: string) => void
  setActiveOutputNode: (nodeId: string | null) => void
  addMessageToOutputNode: (nodeId: string, message: Omit<ConversationMessage, 'id' | 'timestamp'>) => void
  
  // 输出节点连接线操作
  addOutputConnection: (connection: Omit<OutputNodeConnection, 'id' | 'createdAt'>) => void
  updateOutputConnection: (connectionId: string, status: ConnectionStatus) => void
  removeOutputConnection: (connectionId: string) => void
  toggleCardConnection: (nodeId: string, cardId: string) => void
  getNodeContextCards: (nodeId: string) => string[]
  
  // 布局和工具方法
  canDropAt: (position: Position) => boolean
  getSmartPosition: (position: Position) => Position
  getQuestionNodePosition: (questionId: string) => Position | null
  getCardPosition: (cardId: string) => Position | null
  
  // 清空画布
  clearCanvas: () => void
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // 初始状态
  cards: [],
  selectedCardIds: [],
  isDragging: false,
  dragPreview: null,
  viewport: { x: 0, y: 0, zoom: 1 },
  nextZIndex: 1,
  questionNodes: [],
  connections: [],
  aiInputVisible: true, // 默认显示AI输入框
  activeQuestionId: null,
  
  // 输出节点初始状态
  outputNodes: {},
  outputConnections: [],
  activeOutputNodeId: null,

  // 添加卡片
  addCard: ({ noteId, position }) => {
    const state = get()
    const id = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    console.log('🎨 [DEBUG] Store: 添加卡片到状态', {
      noteId,
      position,
      cardId: id,
      currentCardsCount: state.cards.length
    })
    
    const newCard: CanvasCard = {
      id,
      noteId,
      position,
      size: CANVAS_CONSTANTS.DEFAULT_CARD_SIZE,
      isSelected: false,
      zIndex: state.nextZIndex,
      addedAt: new Date()
    }
    
    console.log('🎨 [DEBUG] Store: 新卡片对象', newCard)
    
    set({
      cards: [...state.cards, newCard],
      nextZIndex: state.nextZIndex + 1,
      selectedCardIds: [id] // 自动选中新添加的卡片
    })
    
    console.log('🎨 [DEBUG] Store: 卡片添加后状态', {
      totalCards: state.cards.length + 1,
      newCardsList: [...state.cards, newCard].map(c => ({ id: c.id, noteId: c.noteId }))
    })
  },

  // 批量添加卡片 - 性能优化版本
  addCards: (cardsToAdd) => {
    console.log('\n🎨🎨🎨 [STORE] addCards 函数被调用:')
    console.log('   - 传入的卡片数:', cardsToAdd.length)
    console.log('   - 传入的卡片:', cardsToAdd)
    
    const state = get()
    const timestamp = Date.now()
    
    console.log('   - 当前画布卡片数:', state.cards.length)
    console.log('   - 当前卡片列表:', state.cards.map(c => ({ id: c.id, noteId: c.noteId })))
    console.log('🎨🎨🎨\n')
    
    const newCards: CanvasCard[] = cardsToAdd.map((cardData, index) => {
      const id = `card-${timestamp}-${index}-${Math.random().toString(36).substr(2, 9)}`
      return {
        id,
        noteId: cardData.noteId,
        position: cardData.position,
        size: CANVAS_CONSTANTS.DEFAULT_CARD_SIZE,
        isSelected: false,
        zIndex: state.nextZIndex + index,
        addedAt: new Date()
      }
    })
    
    console.log('\n🎨 [STORE] 批量创建的卡片:', newCards.map(c => ({ id: c.id, noteId: c.noteId })))
    
    // 一次性更新状态，避免多次重渲染
    set({
      cards: [...state.cards, ...newCards],
      nextZIndex: state.nextZIndex + newCards.length,
      selectedCardIds: newCards.map(c => c.id) // 选中所有新添加的卡片
    })
    
    console.log('\n✅ [STORE] addCards 状态更新完成:')
    console.log('   - 更新后画布卡片数:', state.cards.length + newCards.length)
    console.log('   - 新添加的卡片数:', newCards.length)
    console.log('✅\n')
    
    console.log('🎨 [DEBUG] Store: 批量添加完成', {
      totalCards: state.cards.length + newCards.length,
      newCardsCount: newCards.length
    })
  },

  // 更新卡片
  updateCard: (id, updates) => {
    const state = get()
    set({
      cards: state.cards.map(card =>
        card.id === id ? { ...card, ...updates } : card
      )
    })
  },

  // 删除卡片
  removeCard: (id) => {
    const state = get()
    set({
      cards: state.cards.filter(card => card.id !== id),
      selectedCardIds: state.selectedCardIds.filter(cardId => cardId !== id)
    })
  },

  // 选择卡片
  selectCard: (id, isMulti) => {
    const state = get()
    
    if (isMulti) {
      // 多选模式
      if (state.selectedCardIds.includes(id)) {
        // 如果已选中，则取消选中
        set({
          selectedCardIds: state.selectedCardIds.filter(cardId => cardId !== id)
        })
      } else {
        // 添加到选中列表
        set({
          selectedCardIds: [...state.selectedCardIds, id]
        })
      }
    } else {
      // 单选模式
      set({
        selectedCardIds: [id]
      })
    }
    
    // 更新卡片的zIndex，使选中的卡片在最上层
    const maxZIndex = Math.max(...state.cards.map(c => c.zIndex))
    if (state.cards.find(c => c.id === id)?.zIndex !== maxZIndex) {
      set({
        cards: state.cards.map(card =>
          card.id === id ? { ...card, zIndex: maxZIndex + 1 } : card
        ),
        nextZIndex: maxZIndex + 2
      })
    }
  },

  // 清除选择
  clearSelection: () => {
    set({ selectedCardIds: [] })
  },

  // 检查是否可以放置
  canDropAt: (position) => {
    const state = get()
    const cardSize = CARD_SIZES[CANVAS_CONSTANTS.DEFAULT_CARD_SIZE]
    
    // 检查边界
    if (
      position.x < CANVAS_CONSTANTS.EDGE_PADDING ||
      position.y < CANVAS_CONSTANTS.EDGE_PADDING
    ) {
      return false
    }
    
    // 检查与其他卡片的碰撞
    for (const card of state.cards) {
      const cardPos = card.position
      const otherSize = CARD_SIZES[card.size]
      
      // 简单的矩形碰撞检测
      const horizontalOverlap = 
        position.x < cardPos.x + otherSize.width + CANVAS_CONSTANTS.MIN_CARD_DISTANCE &&
        position.x + cardSize.width + CANVAS_CONSTANTS.MIN_CARD_DISTANCE > cardPos.x
      
      const verticalOverlap = 
        position.y < cardPos.y + otherSize.height + CANVAS_CONSTANTS.MIN_CARD_DISTANCE &&
        position.y + cardSize.height + CANVAS_CONSTANTS.MIN_CARD_DISTANCE > cardPos.y
      
      if (horizontalOverlap && verticalOverlap) {
        return false
      }
    }
    
    return true
  },

  // 获取智能位置
  getSmartPosition: (position) => {
    const state = get()
    
    // 如果当前位置可用，直接返回
    if (state.canDropAt(position)) {
      return position
    }
    
    // 寻找最近的有效位置
    const SEARCH_RADIUS = 200
    const STEP = 20
    
    for (let r = STEP; r <= SEARCH_RADIUS; r += STEP) {
      // 以螺旋方式搜索
      for (let angle = 0; angle < 360; angle += 30) {
        const x = position.x + r * Math.cos(angle * Math.PI / 180)
        const y = position.y + r * Math.sin(angle * Math.PI / 180)
        
        if (state.canDropAt({ x, y })) {
          return { x, y }
        }
      }
    }
    
    // 如果找不到合适位置，放在最右边
    const rightMostCard = state.cards.reduce((max, card) => 
      card.position.x > max ? card.position.x : max, 0
    )
    
    return {
      x: rightMostCard + CARD_SIZES[CANVAS_CONSTANTS.DEFAULT_CARD_SIZE].width + 50,
      y: position.y
    }
  },

  // 问题节点操作方法
  addQuestionNode: (question, position) => {
    const state = get()
    const id = `question-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const newQuestionNode: QuestionNodeData = {
      id,
      question,
      status: 'pending',
      relatedNotes: [],
      createdAt: new Date()
    }
    
    set({
      questionNodes: [...state.questionNodes, newQuestionNode],
      activeQuestionId: id,
      aiInputVisible: false // 隐藏AI输入框
    })
    
    return id
  },

  updateQuestionNode: (id, updates) => {
    const state = get()
    set({
      questionNodes: state.questionNodes.map(node =>
        node.id === id ? { ...node, ...updates } : node
      )
    })
  },

  removeQuestionNode: (id) => {
    const state = get()
    set({
      questionNodes: state.questionNodes.filter(node => node.id !== id),
      activeQuestionId: state.activeQuestionId === id ? null : state.activeQuestionId
    })
    
    // 同时删除相关的连接线
    get().removeConnectionsByNodeId(id)
    
    // 如果没有问题节点了，显示AI输入框
    if (state.questionNodes.length === 1) {
      set({ aiInputVisible: true })
    }
  },

  setQuestionNodeAnswer: (id, answer, relatedNotes) => {
    const state = get()
    set({
      questionNodes: state.questionNodes.map(node =>
        node.id === id 
          ? { 
              ...node, 
              answer, 
              relatedNotes, 
              status: 'answered' as QuestionNodeData['status']
            }
          : node
      )
    })
  },

  setQuestionNodeStatus: (id, status) => {
    const state = get()
    set({
      questionNodes: state.questionNodes.map(node =>
        node.id === id ? { ...node, status } : node
      )
    })
  },

  // AI输入框控制
  showAIInput: () => {
    set({ aiInputVisible: true, activeQuestionId: null })
  },

  hideAIInput: () => {
    set({ aiInputVisible: false })
  },

  setActiveQuestion: (id) => {
    set({ activeQuestionId: id })
  },

  // 连接线操作方法
  addConnection: (connectionData) => {
    const state = get()
    const id = `connection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const newConnection: ConnectionData = {
      ...connectionData,
      id
    }
    
    set({
      connections: [...state.connections, newConnection]
    })
  },

  removeConnection: (id) => {
    const state = get()
    set({
      connections: state.connections.filter(conn => conn.id !== id)
    })
  },

  updateConnection: (id, updates) => {
    const state = get()
    set({
      connections: state.connections.map(conn =>
        conn.id === id ? { ...conn, ...updates } : conn
      )
    })
  },

  removeConnectionsByNodeId: (nodeId) => {
    const state = get()
    set({
      connections: state.connections.filter(conn => 
        conn.fromId !== nodeId && conn.toId !== nodeId
      )
    })
  },

  // 位置获取方法
  getQuestionNodePosition: (questionId) => {
    // 这里需要与实际的问题节点组件配合
    // 暂时返回null，实际使用时需要问题节点组件提供位置信息
    return null
  },

  getCardPosition: (cardId) => {
    const state = get()
    const card = state.cards.find(c => c.id === cardId)
    return card ? card.position : null
  },

  // 输出节点操作方法实现
  createOutputNode: (params) => {
    const state = get()
    const id = `output-node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const config = { ...NODE_CONFIGS[params.type], ...params.config }
    
    const newNode: BaseOutputNode = {
      id,
      type: params.type,
      config,
      position: params.position,
      connectedCards: [],
      conversationHistory: [],
      status: 'idle',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 如果是AI聊天节点，添加初始问题
    if (params.type === 'ai-chat' && params.initialQuestion) {
      const chatNode = newNode as AIChatNode
      chatNode.currentQuestion = params.initialQuestion
      chatNode.recalledCards = []
      chatNode.contextCards = []
      chatNode.isExpanded = true
    }

    console.log('🎯 [输出节点] 创建新节点:', { id, type: params.type, position: params.position })

    set({
      outputNodes: { ...state.outputNodes, [id]: newNode },
      activeOutputNodeId: id,
      aiInputVisible: false
    })

    return id
  },

  updateOutputNode: (nodeId, updates) => {
    const state = get()
    const node = state.outputNodes[nodeId]
    if (!node) return

    console.log('🔄 [输出节点] 更新节点:', { nodeId, updates })

    set({
      outputNodes: {
        ...state.outputNodes,
        [nodeId]: { ...node, ...updates, updatedAt: new Date() }
      }
    })
  },

  removeOutputNode: (nodeId) => {
    const state = get()
    const newOutputNodes = { ...state.outputNodes }
    delete newOutputNodes[nodeId]

    // 删除相关连接
    const newConnections = state.outputConnections.filter(
      conn => conn.fromId !== nodeId && conn.toId !== nodeId
    )

    console.log('🗑️ [输出节点] 删除节点:', { nodeId })

    set({
      outputNodes: newOutputNodes,
      outputConnections: newConnections,
      activeOutputNodeId: state.activeOutputNodeId === nodeId ? null : state.activeOutputNodeId,
      aiInputVisible: Object.keys(newOutputNodes).length === 0
    })
  },

  setActiveOutputNode: (nodeId) => {
    console.log('👆 [输出节点] 设置活跃节点:', { nodeId })
    set({ activeOutputNodeId: nodeId })
  },

  addMessageToOutputNode: (nodeId, message) => {
    const state = get()
    const node = state.outputNodes[nodeId]
    if (!node) return

    const newMessage: ConversationMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }

    console.log('💬 [输出节点] 添加消息:', { nodeId, messageId: newMessage.id, role: message.role })

    set({
      outputNodes: {
        ...state.outputNodes,
        [nodeId]: {
          ...node,
          conversationHistory: [...node.conversationHistory, newMessage],
          updatedAt: new Date()
        }
      }
    })
  },

  // 输出节点连接线操作
  addOutputConnection: (connectionData) => {
    const state = get()
    const id = `output-conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const newConnection: OutputNodeConnection = {
      ...connectionData,
      id,
      createdAt: new Date()
    }

    console.log('🔗 [输出连接] 添加连接:', { connectionId: id, from: connectionData.fromId, to: connectionData.toId })

    set({
      outputConnections: [...state.outputConnections, newConnection]
    })
  },

  updateOutputConnection: (connectionId, status) => {
    const state = get()
    const updatedConnections = state.outputConnections.map(conn =>
      conn.id === connectionId 
        ? { ...conn, status, lastUsedAt: status === ConnectionStatus.ACTIVE ? new Date() : conn.lastUsedAt }
        : conn
    )

    console.log('🔄 [输出连接] 更新连接状态:', { connectionId, status })

    set({ outputConnections: updatedConnections })
  },

  removeOutputConnection: (connectionId) => {
    const state = get()
    const newConnections = state.outputConnections.filter(conn => conn.id !== connectionId)

    console.log('🗑️ [输出连接] 删除连接:', { connectionId })

    set({ outputConnections: newConnections })
  },

  toggleCardConnection: (nodeId, cardId) => {
    const state = get()
    
    // 查找是否已有连接
    const existingConnection = state.outputConnections.find(
      conn => 
        (conn.fromId === nodeId && conn.toId === cardId) ||
        (conn.fromId === cardId && conn.toId === nodeId)
    )

    if (existingConnection) {
      // 切换连接状态
      const newStatus = existingConnection.status === ConnectionStatus.ACTIVE 
        ? ConnectionStatus.DISABLED 
        : ConnectionStatus.ACTIVE

      get().updateOutputConnection(existingConnection.id, newStatus)
      console.log('🔄 [上下文] 切换卡片连接:', { nodeId, cardId, newStatus })
    } else {
      // 创建新连接
      get().addOutputConnection({
        fromId: nodeId,
        toId: cardId,
        fromType: 'outputNode',
        toType: 'card',
        status: ConnectionStatus.ACTIVE,
        strength: 1.0
      })
      console.log('➕ [上下文] 添加卡片连接:', { nodeId, cardId })
    }
  },

  getNodeContextCards: (nodeId) => {
    const state = get()
    return state.outputConnections
      .filter(conn => 
        conn.fromId === nodeId && 
        conn.toType === 'card' && 
        conn.status === ConnectionStatus.ACTIVE
      )
      .map(conn => conn.toId)
  },

  // 清空画布
  clearCanvas: () => {
    set({
      cards: [],
      selectedCardIds: [],
      questionNodes: [],
      connections: [],
      outputNodes: {},
      outputConnections: [],
      aiInputVisible: true,
      activeQuestionId: null,
      activeOutputNodeId: null,
      nextZIndex: 1
    })
  }
}))