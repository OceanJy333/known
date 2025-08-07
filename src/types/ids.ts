/**
 * 统一的ID类型定义
 * 为不同类型的ID提供类型安全
 */

// 基础ID类型
export type BaseID = string

// 知识库相关ID类型
export type NoteID = string & { readonly __brand: 'NoteID' }
export type TagID = string & { readonly __brand: 'TagID' }
export type CategoryID = string & { readonly __brand: 'CategoryID' }
export type SaveRecordID = string & { readonly __brand: 'SaveRecordID' }

// 画布系统相关ID类型
export type CanvasCardID = string & { readonly __brand: 'CanvasCardID' }
export type CanvasSessionID = string & { readonly __brand: 'CanvasSessionID' }
export type ConnectionID = string & { readonly __brand: 'ConnectionID' }

// 问题节点相关ID类型
export type QuestionNodeID = string & { readonly __brand: 'QuestionNodeID' }

// 输出节点相关ID类型
export type OutputNodeID = string & { readonly __brand: 'OutputNodeID' }
export type OutputConnectionID = string & { readonly __brand: 'OutputConnectionID' }

// 对话消息相关ID类型
export type ChatMessageID = string & { readonly __brand: 'ChatMessageID' }
export type ConversationMessageID = string & { readonly __brand: 'ConversationMessageID' }

// 界面交互相关ID类型
export type TabID = string & { readonly __brand: 'TabID' }
export type DiffActionID = string & { readonly __brand: 'DiffActionID' }

// 媒体文件相关ID类型
export type MediaFileID = string & { readonly __brand: 'MediaFileID' }
export type MediaSectionID = string & { readonly __brand: 'MediaSectionID' }

// 节点类型相关ID类型
export type NodeTypeID = string & { readonly __brand: 'NodeTypeID' }
export type DragDataID = string & { readonly __brand: 'DragDataID' }

// 用户相关ID类型
export type UserID = string & { readonly __brand: 'UserID' }

// ID联合类型
export type AnyID = 
  | NoteID
  | TagID
  | CategoryID
  | SaveRecordID
  | CanvasCardID
  | CanvasSessionID
  | ConnectionID
  | QuestionNodeID
  | OutputNodeID
  | OutputConnectionID
  | ChatMessageID
  | ConversationMessageID
  | TabID
  | DiffActionID
  | MediaFileID
  | MediaSectionID
  | NodeTypeID
  | DragDataID
  | UserID

// ID类型守卫
export const IDGuards = {
  isNoteID: (id: string): id is NoteID => id.startsWith('note-'),
  isTagID: (id: string): id is TagID => id.startsWith('tag-'),
  isCategoryID: (id: string): id is CategoryID => id.startsWith('cat-'),
  isSaveRecordID: (id: string): id is SaveRecordID => id.startsWith('save-'),
  isCanvasCardID: (id: string): id is CanvasCardID => id.startsWith('card-'),
  isCanvasSessionID: (id: string): id is CanvasSessionID => id.startsWith('session-'),
  isConnectionID: (id: string): id is ConnectionID => id.startsWith('conn-'),
  isQuestionNodeID: (id: string): id is QuestionNodeID => id.startsWith('question-'),
  isOutputNodeID: (id: string): id is OutputNodeID => id.startsWith('output-'),
  isOutputConnectionID: (id: string): id is OutputConnectionID => id.startsWith('output-conn-'),
  isChatMessageID: (id: string): id is ChatMessageID => id.startsWith('msg-'),
  isConversationMessageID: (id: string): id is ConversationMessageID => id.startsWith('conv-msg-'),
  isTabID: (id: string): id is TabID => id.startsWith('tab-'),
  isDiffActionID: (id: string): id is DiffActionID => id.startsWith('diff-'),
  isMediaFileID: (id: string): id is MediaFileID => id.startsWith('media-'),
  isMediaSectionID: (id: string): id is MediaSectionID => id.startsWith('section-'),
  isNodeTypeID: (id: string): id is NodeTypeID => id.startsWith('node-type-'),
  isDragDataID: (id: string): id is DragDataID => id.startsWith('drag-'),
  isUserID: (id: string): id is UserID => id.startsWith('user-') || id.startsWith('usr-')
}

// ID转换工具
export const IDConverters = {
  // 将普通字符串转换为特定类型的ID
  toNoteID: (id: string): NoteID => id as NoteID,
  toTagID: (id: string): TagID => id as TagID,
  toCategoryID: (id: string): CategoryID => id as CategoryID,
  toSaveRecordID: (id: string): SaveRecordID => id as SaveRecordID,
  toCanvasCardID: (id: string): CanvasCardID => id as CanvasCardID,
  toCanvasSessionID: (id: string): CanvasSessionID => id as CanvasSessionID,
  toConnectionID: (id: string): ConnectionID => id as ConnectionID,
  toQuestionNodeID: (id: string): QuestionNodeID => id as QuestionNodeID,
  toOutputNodeID: (id: string): OutputNodeID => id as OutputNodeID,
  toOutputConnectionID: (id: string): OutputConnectionID => id as OutputConnectionID,
  toChatMessageID: (id: string): ChatMessageID => id as ChatMessageID,
  toConversationMessageID: (id: string): ConversationMessageID => id as ConversationMessageID,
  toTabID: (id: string): TabID => id as TabID,
  toDiffActionID: (id: string): DiffActionID => id as DiffActionID,
  toMediaFileID: (id: string): MediaFileID => id as MediaFileID,
  toMediaSectionID: (id: string): MediaSectionID => id as MediaSectionID,
  toNodeTypeID: (id: string): NodeTypeID => id as NodeTypeID,
  toDragDataID: (id: string): DragDataID => id as DragDataID,
  toUserID: (id: string): UserID => id as UserID,
  
  // 将特定类型的ID转换为普通字符串
  toString: (id: AnyID): string => id as string
}

// ID关系映射
export interface IDRelationship {
  // 父子关系
  parent?: AnyID
  children?: AnyID[]
  
  // 引用关系
  references?: AnyID[]
  referencedBy?: AnyID[]
  
  // 关联关系
  related?: AnyID[]
  
  // 依赖关系
  depends?: AnyID[]
  dependents?: AnyID[]
}

// ID元数据
export interface IDMetadata {
  id: AnyID
  type: string
  createdAt: Date
  updatedAt?: Date
  version?: number
  tags?: string[]
  relationships?: IDRelationship
  
  // 额外属性
  [key: string]: any
}

// ID索引类型
export interface IDIndex {
  byType: Map<string, Set<AnyID>>
  byPrefix: Map<string, Set<AnyID>>
  byPattern: Map<RegExp, Set<AnyID>>
  metadata: Map<AnyID, IDMetadata>
}

// ID验证规则
export interface IDValidationRule {
  pattern: RegExp
  message: string
  validator?: (id: string) => boolean
}

// 常用ID验证规则
export const commonIDValidationRules: Record<string, IDValidationRule> = {
  noteID: {
    pattern: /^note-\d+-[a-z0-9]+$/,
    message: 'Note ID must follow format: note-{timestamp}-{random}'
  },
  canvasCardID: {
    pattern: /^card-\d+-[a-z0-9]+$/,
    message: 'Canvas Card ID must follow format: card-{timestamp}-{random}'
  },
  questionNodeID: {
    pattern: /^question-\d+-[a-z0-9]+$/,
    message: 'Question Node ID must follow format: question-{timestamp}-{random}'
  },
  outputNodeID: {
    pattern: /^output-\d+-[a-z0-9]+$/,
    message: 'Output Node ID must follow format: output-{timestamp}-{random}'
  },
  connectionID: {
    pattern: /^conn-\d+-[a-z0-9]+$/,
    message: 'Connection ID must follow format: conn-{timestamp}-{random}'
  },
  messageID: {
    pattern: /^msg-\d+-[a-z0-9]+$/,
    message: 'Message ID must follow format: msg-{timestamp}-{random}'
  },
  secureID: {
    pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    message: 'Secure ID must be a valid UUID'
  }
}

// 导出所有ID类型的数组，便于遍历
export const allIDTypes = [
  'NoteID',
  'TagID', 
  'CategoryID',
  'SaveRecordID',
  'CanvasCardID',
  'CanvasSessionID',
  'ConnectionID',
  'QuestionNodeID',
  'OutputNodeID',
  'OutputConnectionID',
  'ChatMessageID',
  'ConversationMessageID',
  'TabID',
  'DiffActionID',
  'MediaFileID',
  'MediaSectionID',
  'NodeTypeID',
  'DragDataID',
  'UserID'
] as const

export type IDTypeName = typeof allIDTypes[number]