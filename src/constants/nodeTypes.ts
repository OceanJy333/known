import type { NodeType } from '@/types/nodeTypes'

export const NODE_TYPES: NodeType[] = [
  {
    id: 'ai-chat',
    name: 'AI对话',
    icon: 'fa-robot',
    color: '#3b82f6',
    description: '智能问答和对话交流',
    category: 'interaction',
    defaultSize: {
      width: 400,
      height: 300
    }
  },
  {
    id: 'html-page',
    name: '网页',
    icon: 'fa-globe',
    color: '#10b981',
    description: '嵌入网页内容或预览',
    category: 'content',
    defaultSize: {
      width: 600,
      height: 400
    }
  },
  {
    id: 'text-note',
    name: '文本',
    icon: 'fa-file-text',
    color: '#6b7280',
    description: '纯文本笔记编辑',
    category: 'content',
    defaultSize: {
      width: 300,
      height: 200
    }
  },
  {
    id: 'image-node',
    name: '图片',
    icon: 'fa-image',
    color: '#8b5cf6',
    description: '图片展示和标注',
    category: 'content',
    defaultSize: {
      width: 400,
      height: 300
    }
  },
  {
    id: 'svg-card',
    name: 'SVG卡片',
    icon: 'fa-file-image',
    color: '#f59e0b',
    description: '生成精美的知识卡片',
    category: 'content',
    defaultSize: {
      width: 420,
      height: 320
    }
  }
]

// 根据类别分组
export const NODE_CATEGORIES = {
  interaction: NODE_TYPES.filter(node => node.category === 'interaction'),
  content: NODE_TYPES.filter(node => node.category === 'content'),
  utility: NODE_TYPES.filter(node => node.category === 'utility')
}

// 根据ID获取节点类型
export const getNodeTypeById = (id: string): NodeType | undefined => {
  return NODE_TYPES.find(node => node.id === id)
}