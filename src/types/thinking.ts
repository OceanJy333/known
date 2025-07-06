// 沉思模式相关类型定义

export type AppMode = 'sediment' | 'thinking'  // 沉淀模式 | 沉思模式

export interface ModeConfig {
  icon: string
  label: string
  description: string
  shortcut: string
}

export const modeConfig: Record<AppMode, ModeConfig> = {
  sediment: {
    icon: '📝',
    label: '沉淀模式',
    description: '文档分析与笔记生成',
    shortcut: '⌘+1'
  },
  thinking: {
    icon: '🧠',
    label: '沉思模式',
    description: '知识召回与深度对话',
    shortcut: '⌘+2'
  }
}

// 笔记相关类型
export interface Note {
  id: string
  title: string
  content: string
  originalContent: string
  summary: string
  tags: TagSystem
  createdAt: Date
  updatedAt: Date
  lastAccessedAt: Date
  accessCount: number
  isStarred: boolean
  metadata: {
    wordCount: number
    readingTime: number
    sourceType: 'upload' | 'import' | 'manual'
    sourceUrl?: string
    fileType?: string
  }
  embedding?: number[]
}

// 标签系统
export interface TagSystem {
  contentType: {
    docType: "文章" | "论文" | "报告" | "笔记" | "教程"
    mediaType: "文本" | "图片" | "视频" | "PDF"
    sourceType: "网页" | "本地文件" | "导入"
  }
  
  domain: {
    primary: string
    secondary: string[]
    keywords: string[]
  }
  
  cognitive: {
    complexity: "入门" | "中级" | "高级" | "专家"
    knowledgeType: "事实" | "概念" | "原理" | "方法" | "案例"
    abstractLevel: "具体" | "抽象" | "理论" | "实践"
  }
  
  functional: {
    purpose: "学习资料" | "工作参考" | "灵感来源" | "项目资料"
    importance: "核心" | "重要" | "一般" | "参考"
    urgency: "紧急" | "重要不紧急" | "一般" | "存档"
  }
}

// 搜索相关类型
export interface SearchFilters {
  mode: 'keyword' | 'tag' | 'semantic'
  tags: string[]
  dateRange?: { from: Date; to: Date }
  domains?: string[]
}

// 画布相关类型
export interface Canvas {
  id: string
  title?: string
  questionNode: QuestionNode
  connectedNotes: ConnectedNote[]
  recommendedNotes: Note[]
  viewport: {
    x: number
    y: number
    zoom: number
  }
  createdAt: Date
  updatedAt: Date
}

export interface QuestionNode {
  id: string
  question: string
  aiResponse: string
  conversation: Message[]
  position: { x: number, y: number }
}

export interface ConnectedNote {
  noteId: string
  position: { x: number, y: number }
  size: 'small' | 'medium' | 'large'
  connectionStrength: number
}

export interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  contextNoteIds: string[]
}