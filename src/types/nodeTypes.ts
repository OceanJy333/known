export interface NodeType {
  id: string
  name: string
  icon: string
  color: string
  description: string
  category: 'interaction' | 'content' | 'utility'
  defaultSize?: {
    width: number
    height: number
  }
}

export interface NodeDragData {
  type: 'node-template'
  id: string
  nodeType: string
  metadata: {
    title: string
    description: string
    defaultSize?: {
      width: number
      height: number
    }
  }
}

// 扩展现有的 DragData 类型
export interface ExtendedDragData {
  type: 'note' | 'node-template'
  id: string
  nodeType?: string
  metadata?: {
    title?: string
    description?: string
    defaultContent?: string
    defaultSize?: {
      width: number
      height: number
    }
  }
}