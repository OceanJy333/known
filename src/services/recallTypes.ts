// 召回服务相关类型定义
export interface RecalledCard {
  id: string
  title: string
  summary?: string
  content?: string
  tags?: string[]
  category?: string
  relevance: number    // 相关度评分 0-1
  reason: string      // 召回原因
}

export interface RecallResult {
  cards: RecalledCard[]
  searchStats: {
    totalNotesSearched: number
    notesFound: number
    averageRelevance: string
  }
  fallback?: boolean
}

export interface RecallOptions {
  maxResults?: number
  relevanceThreshold?: number
  maxKnowledgeBaseSize?: number
  summaryMaxLength?: number
}

export interface KnowledgeNote {
  id: string
  title: string
  summary?: string
  content?: string
  tags?: string[]
  category?: string
}