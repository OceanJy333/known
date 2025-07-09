// 画布相关类型定义

export interface Position {
  x: number
  y: number
}

export interface CanvasViewport {
  x: number
  y: number
  zoom: number
}

export interface CanvasCard {
  id: string
  noteId: string
  position: Position
  size: 'small' | 'medium' | 'large'
  isSelected: boolean
  zIndex: number
  addedAt: Date
}

export interface CanvasState {
  cards: CanvasCard[]
  selectedCardIds: string[]
  isDragging: boolean
  dragPreview: DragPreview | null
  viewport: CanvasViewport
  nextZIndex: number
}

export interface DragPreview {
  noteId: string
  noteTitle: string
  mousePosition: Position
  isValidDropZone: boolean
}

export interface DragData {
  type: 'note'
  noteId: string
  noteTitle: string
  noteSummary: string
  noteTags: string[]
}

export interface SavedCanvas {
  id: string
  name: string
  cards: CanvasCard[]
  viewport: CanvasViewport
  createdAt: Date
  updatedAt: Date
}

export const CARD_SIZES = {
  small: { width: 240, height: 160 },
  medium: { width: 280, height: 240 },
  large: { width: 340, height: 300 }
} as const

export interface CardContentConfig {
  titleMaxLength: number
  contentMaxLength: number
  showKeyPoints: boolean
  showMetadata: boolean
  maxTags: number
}

export const CARD_CONTENT_CONFIG: Record<CanvasCard['size'], CardContentConfig> = {
  small: {
    titleMaxLength: 20,
    contentMaxLength: 80,
    showKeyPoints: false,
    showMetadata: false,
    maxTags: 2
  },
  medium: {
    titleMaxLength: 30,
    contentMaxLength: 200,
    showKeyPoints: true,
    showMetadata: false,
    maxTags: 3
  },
  large: {
    titleMaxLength: 50,
    contentMaxLength: 500,
    showKeyPoints: true,
    showMetadata: true,
    maxTags: 5
  }
}

export const CANVAS_CONSTANTS = {
  MIN_CARD_DISTANCE: 20,
  EDGE_PADDING: 10,
  MAX_CARDS: 20,
  GRID_SIZE: 20,
  DEFAULT_CARD_SIZE: 'medium' as const,
  // 问题节点相关常量
  QUESTION_NODE_WIDTH: 320,
  QUESTION_NODE_HEIGHT: 180,
  QUESTION_NODE_EXPANDED_WIDTH: 480,
  QUESTION_NODE_EXPANDED_HEIGHT: 300,
  // 连接线相关常量
  CONNECTION_STRENGTH_THRESHOLD: 0.6,
  CONNECTION_ANIMATION_DURATION: 2000
}

// 连接线类型（支持问题节点和笔记卡片之间的连接）
export interface Connection {
  id: string
  fromId: string
  toId: string
  fromType: 'question' | 'note'
  toType: 'question' | 'note'
  relationshipType?: 'related' | 'derived' | 'referenced' | 'similar'
  strength?: number // 关系强度 0-1
  isHighlighted?: boolean
  isAnimated?: boolean
}

// AI输入框配置
export interface AIInputConfig {
  isVisible: boolean
  position?: Position
  placeholder?: string
  suggestions?: string[]
}

// 问题处理状态
export interface QuestionProcessingState {
  stage: 'idle' | 'analyzing' | 'searching' | 'generating' | 'complete'
  message: string
  progress: number
}

// 画布布局配置
export interface CanvasLayoutConfig {
  centerPosition: Position
  nodeSpacing: number
  radiusIncrement: number
  maxRadius: number
  preferredAngleOffset: number
}

// 智能布局选项
export interface SmartLayoutOptions {
  avoidOverlap: boolean
  maintainConnections: boolean
  animateTransition: boolean
  preserveUserPositions: boolean
}