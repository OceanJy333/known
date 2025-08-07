import { Position } from './canvas'
import { KnowledgeNote } from './knowledge'

// 输出节点配置
export interface OutputNodeConfig {
  nodeType: 'ai-chat' | 'svg-card'
  modelProvider: 'openai' | 'anthropic' | 'local'
  modelName: string
  systemPrompt: string
  outputFormat: 'text' | 'svg'
  contextStrategy: 'full' | 'summary' | 'keywords'
}

// 对话消息
export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  contextCards?: string[] // 此消息使用的上下文卡片ID
}

// 基础输出节点接口
export interface BaseOutputNode {
  id: string
  type: string
  config: OutputNodeConfig
  position: Position
  connectedCards: string[] // 连接的卡片ID
  conversationHistory: ConversationMessage[]
  status: 'idle' | 'recalling' | 'generating' | 'extracting' | 'completed' | 'error'
  createdAt: Date
  updatedAt: Date
}

// AI对话节点
export interface AIChatNode extends BaseOutputNode {
  type: 'ai-chat'
  recalledCards: KnowledgeNote[] // 当前问题召回的卡片
  contextCards: KnowledgeNote[] // 作为上下文的卡片
  isExpanded: boolean
}

// SVG知识卡片节点
export interface SVGCardNode extends BaseOutputNode {
  type: 'svg-card'
  svgContent: string // 生成的SVG代码
  template: 'modern' | 'minimal' | 'academic' | 'creative' // 模板类型
  sourceCardIds: string[] // 来源知识卡片ID
  extractedContent?: {
    title: string
    summary: string
    keyPoints: string[]
    tags: string[]
  }
}

// 连接状态枚举
export enum ConnectionStatus {
  ACTIVE = 'active',      // 蓝色实线 - 作为上下文参与回答
  RELATED = 'related',    // 灰色虚线 - 相关但未参与上下文  
  DISABLED = 'disabled',  // 红色删除线 - 用户手动断开
  NEW = 'new',           // 绿色 - 新召回的卡片连接
  FLOWING = 'flowing',    // 绿色流动线 - 数据正在传输处理中
  ERROR = 'error'        // 红色断线 - 连接出现问题需要用户处理
}

// 扩展连接数据
export interface OutputNodeConnection {
  id: string
  fromId: string
  toId: string
  fromType: 'outputNode' | 'card'
  toType: 'outputNode' | 'card'
  status: ConnectionStatus
  strength: number // 关系强度 0-1
  createdAt: Date
  lastUsedAt?: Date // 最后使用时间
}

// 输出节点管理器状态
export interface OutputNodeState {
  nodes: Record<string, BaseOutputNode>
  activeNodeId: string | null
  connections: OutputNodeConnection[]
}

// 节点创建参数
export interface CreateNodeParams {
  type: string
  position: Position
  initialQuestion?: string
  config?: Partial<OutputNodeConfig>
}

// 节点配置预设
export const NODE_CONFIGS: Record<string, OutputNodeConfig> = {
  'ai-chat': {
    nodeType: 'ai-chat',
    modelProvider: 'openai',
    modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    systemPrompt: `你是一个专业的知识助手。基于用户提供的知识卡片内容，为用户的问题提供准确、有帮助的回答。

回答要求：
1. 基于提供的知识卡片内容进行回答
2. 保持客观、准确的语调
3. 如果知识卡片中没有相关信息，请诚实说明
4. 提供具体、可操作的建议
5. 适当引用知识卡片中的关键信息`,
    outputFormat: 'text',
    contextStrategy: 'full'
  },
  'svg-card': {
    nodeType: 'svg-card',
    modelProvider: 'openai',
    modelName: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    systemPrompt: '你是一个专业的SVG知识卡片生成器。基于用户提供的知识内容，提取结构化信息并生成精美的SVG卡片。',
    outputFormat: 'svg',
    contextStrategy: 'summary'
  }
}

// 状态更新动作
export type OutputNodeAction = 
  | { type: 'CREATE_NODE'; payload: CreateNodeParams }
  | { type: 'UPDATE_NODE'; payload: { nodeId: string; updates: Partial<BaseOutputNode> } }
  | { type: 'DELETE_NODE'; payload: { nodeId: string } }
  | { type: 'SET_ACTIVE_NODE'; payload: { nodeId: string | null } }
  | { type: 'ADD_CONNECTION'; payload: Omit<OutputNodeConnection, 'id' | 'createdAt'> }
  | { type: 'UPDATE_CONNECTION'; payload: { connectionId: string; status: ConnectionStatus } }
  | { type: 'REMOVE_CONNECTION'; payload: { connectionId: string } }
  | { type: 'ADD_MESSAGE'; payload: { nodeId: string; message: Omit<ConversationMessage, 'id' | 'timestamp'> } }