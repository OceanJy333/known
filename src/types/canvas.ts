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
  DEFAULT_CARD_SIZE: 'medium' as const
}