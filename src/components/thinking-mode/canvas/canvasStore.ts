import { create } from 'zustand'
import { 
  CanvasState, 
  CanvasCard, 
  Position, 
  CANVAS_CONSTANTS,
  CARD_SIZES
} from '@/types/canvas'

interface CanvasStore extends CanvasState {
  // 操作方法
  addCard: (params: { noteId: string; position: Position }) => void
  updateCard: (id: string, updates: Partial<CanvasCard>) => void
  removeCard: (id: string) => void
  selectCard: (id: string, isMulti: boolean) => void
  clearSelection: () => void
  
  // 工具方法
  canDropAt: (position: Position) => boolean
  getSmartPosition: (position: Position) => Position
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  // 初始状态
  cards: [],
  selectedCardIds: [],
  isDragging: false,
  dragPreview: null,
  viewport: { x: 0, y: 0, zoom: 1 },
  nextZIndex: 1,

  // 添加卡片
  addCard: ({ noteId, position }) => {
    const state = get()
    const id = `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const newCard: CanvasCard = {
      id,
      noteId,
      position,
      size: CANVAS_CONSTANTS.DEFAULT_CARD_SIZE,
      isSelected: false,
      zIndex: state.nextZIndex,
      addedAt: new Date()
    }
    
    set({
      cards: [...state.cards, newCard],
      nextZIndex: state.nextZIndex + 1,
      selectedCardIds: [id] // 自动选中新添加的卡片
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
  }
}))