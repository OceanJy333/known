// 标签页类型定义

export interface TableOfContent {
  id: string
  title: string
  level: number
  summary?: string
  anchor?: string
  location?: {
    textAnchor?: string
    charPosition?: number
  }
}

export interface TabData {
  id: string
  title: string
  filename: string
  markdownContent: string
  toc: TableOfContent[]
  isAnalyzing: boolean
  createdAt: number
  lastModified: number
  // AI 导读相关
  documentSummary?: string
  wordCount?: number
  readingTime?: number
}

export interface TabsState {
  tabs: TabData[]
  activeTabId: string | null
  nextTabId: number
}

export interface TabsActions {
  createTab: (title?: string) => string
  closeTab: (tabId: string) => void
  switchTab: (tabId: string) => void
  updateTab: (tabId: string, updates: Partial<TabData>) => void
  getActiveTab: () => TabData | null
}