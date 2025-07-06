// 知识库相关的类型定义

export interface KnowledgeNote {
  id: string                    // 唯一标识
  title: string                 // 笔记标题
  content: string               // 笔记内容（Markdown格式）
  summary: string               // AI生成的摘要
  tags: string[]               // 标签数组
  category: string             // 分类
  source: 'upload' | 'chat' | 'manual' // 来源类型
  sourceFile?: string          // 原始文件名（如果来自上传）
  createdAt: Date              // 创建时间
  updatedAt: Date              // 最后更新时间
  wordCount: number            // 字数统计
  readingTime: number          // 预计阅读时间（分钟）
  difficulty: 'easy' | 'medium' | 'hard' // 难度等级
  keyPoints: string[]          // 关键要点
  relatedNotes: string[]       // 相关笔记ID
  embedding?: number[]         // 向量嵌入（用于语义搜索）
  accessCount: number          // 访问次数
  lastAccessed: Date           // 最后访问时间
  rating?: number              // 用户评分 (1-5)
  isFavorite: boolean          // 是否收藏
  isArchived: boolean          // 是否已归档
  saveHistory: SaveRecord[]    // 保存历史记录
}

export interface SaveRecord {
  id: string                   // 保存记录ID
  timestamp: Date              // 保存时间戳
  type: 'create' | 'edit' | 'auto' // 保存类型
  changeDescription?: string   // 变更描述
  changedFields: string[]      // 变更的字段
  wordCountDelta?: number      // 字数变化
  version: number              // 版本号
  userId?: string              // 操作用户ID（如果有用户系统）
}

export interface KnowledgeTag {
  id: string                   // 标签ID
  name: string                 // 标签名称
  color: string                // 标签颜色
  description?: string         // 标签描述
  noteCount: number            // 包含此标签的笔记数量
  createdAt: Date              // 创建时间
}

export interface KnowledgeCategory {
  id: string                   // 分类ID
  name: string                 // 分类名称
  description?: string         // 分类描述
  color: string                // 分类颜色
  icon: string                 // 分类图标
  noteCount: number            // 包含此分类的笔记数量
  parentId?: string            // 父分类ID（支持嵌套分类）
  order: number                // 排序权重
}

export interface SearchFilters {
  tags?: string[]              // 标签过滤
  categories?: string[]        // 分类过滤
  difficulty?: string[]        // 难度过滤
  dateRange?: {                // 日期范围过滤
    start: Date
    end: Date
  }
  minRating?: number           // 最低评分过滤
  source?: string[]            // 来源过滤
  isFavorite?: boolean         // 是否只显示收藏
  isArchived?: boolean         // 是否包含归档
}

export interface SearchResult {
  note: KnowledgeNote
  matchScore: number           // 匹配度分数
  matchHighlights: string[]    // 匹配高亮片段
  matchReason: string          // 匹配原因
}

export interface KnowledgeStats {
  totalNotes: number           // 总笔记数
  totalWords: number           // 总字数
  totalReadingTime: number     // 总阅读时间
  averageRating: number        // 平均评分
  topTags: Array<{             // 最热标签
    tag: KnowledgeTag
    count: number
  }>
  topCategories: Array<{       // 最热分类
    category: KnowledgeCategory
    count: number
  }>
  recentNotes: KnowledgeNote[] // 最近笔记
  favoriteNotes: KnowledgeNote[] // 收藏笔记
  trendingNotes: KnowledgeNote[] // 趋势笔记（基于访问量）
}

export interface QuestionNode {
  id: string                   // 问题节点ID
  question: string             // 问题内容
  answer?: string              // AI回答
  relatedNotes: string[]       // 相关笔记ID
  position: { x: number; y: number } // 画布位置
  createdAt: Date              // 创建时间
  status: 'pending' | 'answered' | 'archived' // 状态
}

export interface CanvasSession {
  id: string                   // 会话ID
  title: string                // 会话标题
  description?: string         // 会话描述
  questionNodes: QuestionNode[] // 问题节点列表
  noteCards: Array<{           // 笔记卡片
    noteId: string
    position: { x: number; y: number }
    size: { width: number; height: number }
  }>
  connections: Array<{         // 连接线
    from: string
    to: string
    type: 'question-note' | 'note-note' | 'question-question'
  }>
  createdAt: Date              // 创建时间
  updatedAt: Date              // 最后更新时间
  isActive: boolean            // 是否活跃会话
}