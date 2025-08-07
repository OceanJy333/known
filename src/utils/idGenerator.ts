/**
 * 统一的ID生成器
 * 用于管理项目中所有类型的ID生成
 */

// ID类型枚举
export enum IDType {
  // 知识库相关
  NOTE = 'note',
  TAG = 'tag',
  CATEGORY = 'cat',
  SAVE_RECORD = 'save',
  
  // 画布系统相关
  CANVAS_CARD = 'card',
  CANVAS_SESSION = 'session',
  CONNECTION = 'conn',
  
  // 问题节点相关
  QUESTION_NODE = 'question',
  
  // 输出节点相关
  OUTPUT_NODE = 'output',
  OUTPUT_CONNECTION = 'output-conn',
  
  // 对话消息相关
  CHAT_MESSAGE = 'msg',
  CONVERSATION_MESSAGE = 'conv-msg',
  
  // 界面交互相关
  TAB = 'tab',
  DIFF_ACTION = 'diff',
  
  // 媒体文件相关
  MEDIA_FILE = 'media',
  MEDIA_SECTION = 'section',
  
  // 节点类型相关
  NODE_TYPE = 'node-type',
  DRAG_DATA = 'drag'
}

// ID生成模式枚举
export enum IDGenerationMode {
  // 高安全性UUID，用于重要数据
  SECURE = 'secure',
  // 基于时间戳的可排序ID，用于时序相关数据
  TIMESTAMP = 'timestamp',
  // 简单时间戳，用于临时数据
  SIMPLE = 'simple',
  // 自增ID，用于需要顺序的数据
  SEQUENCE = 'sequence'
}

// ID生成器配置
interface IDGeneratorConfig {
  type: IDType
  mode: IDGenerationMode
  prefix?: string
  length?: number
}

// 自增计数器
const sequenceCounters = new Map<string, number>()

/**
 * 生成安全的UUID
 */
function generateSecureID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // 备选方案：基于时间戳和随机数的UUID v4格式
  const timestamp = Date.now().toString(16)
  const randomPart = Math.random().toString(36).substr(2, 15)
  return `${timestamp}-${randomPart}-${Math.random().toString(36).substr(2, 15)}`
}

/**
 * 生成基于时间戳的ID
 */
function generateTimestampID(prefix: string): string {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substr(2, 9)
  return `${prefix}-${timestamp}-${randomSuffix}`
}

/**
 * 生成简单的时间戳ID
 */
function generateSimpleID(): string {
  return Date.now().toString()
}

/**
 * 生成自增序列ID
 */
function generateSequenceID(prefix: string): string {
  const key = prefix || 'default'
  const current = sequenceCounters.get(key) || 0
  const next = current + 1
  sequenceCounters.set(key, next)
  return `${prefix}-${next}`
}

/**
 * 主ID生成器
 */
export class IDGenerator {
  private static instance: IDGenerator
  
  private constructor() {}
  
  static getInstance(): IDGenerator {
    if (!IDGenerator.instance) {
      IDGenerator.instance = new IDGenerator()
    }
    return IDGenerator.instance
  }
  
  /**
   * 生成指定类型的ID
   */
  generate(type: IDType, mode: IDGenerationMode = IDGenerationMode.TIMESTAMP): string {
    const config: IDGeneratorConfig = {
      type,
      mode,
      prefix: type
    }
    
    return this.generateWithConfig(config)
  }
  
  /**
   * 使用配置生成ID
   */
  generateWithConfig(config: IDGeneratorConfig): string {
    const prefix = config.prefix || config.type
    
    switch (config.mode) {
      case IDGenerationMode.SECURE:
        return generateSecureID()
      
      case IDGenerationMode.TIMESTAMP:
        return generateTimestampID(prefix)
      
      case IDGenerationMode.SIMPLE:
        return generateSimpleID()
      
      case IDGenerationMode.SEQUENCE:
        return generateSequenceID(prefix)
      
      default:
        return generateTimestampID(prefix)
    }
  }
  
  /**
   * 生成批量ID
   */
  generateBatch(type: IDType, count: number, mode: IDGenerationMode = IDGenerationMode.TIMESTAMP): string[] {
    const ids: string[] = []
    const baseTimestamp = Date.now()
    
    for (let i = 0; i < count; i++) {
      if (mode === IDGenerationMode.TIMESTAMP) {
        // 批量生成时，使用基础时间戳+索引避免重复
        const timestamp = baseTimestamp + i
        const randomSuffix = Math.random().toString(36).substr(2, 9)
        ids.push(`${type}-${timestamp}-${randomSuffix}`)
      } else {
        ids.push(this.generate(type, mode))
      }
    }
    
    return ids
  }
  
  /**
   * 生成重试ID
   */
  generateRetryID(originalId: string, retryCount: number): string {
    return `${originalId}_retry_${retryCount}_${Date.now()}`
  }
  
  /**
   * 验证ID格式
   */
  validateID(id: string, type?: IDType): boolean {
    if (!id || typeof id !== 'string') {
      return false
    }
    
    // 基本格式检查
    if (id.length < 3) {
      return false
    }
    
    // 类型特定检查
    if (type) {
      return id.startsWith(type + '-') || id.startsWith(type + '_')
    }
    
    return true
  }
  
  /**
   * 从ID中提取类型
   */
  extractType(id: string): string | null {
    const match = id.match(/^([^-_]+)[-_]/)
    return match ? match[1] : null
  }
  
  /**
   * 从ID中提取时间戳
   */
  extractTimestamp(id: string): number | null {
    const match = id.match(/[-_](\d{13})[-_]/)
    return match ? parseInt(match[1], 10) : null
  }
}

// 便捷方法导出
export const idGenerator = IDGenerator.getInstance()

// 常用ID生成器的便捷方法
export const generateID = {
  // 知识库相关
  note: () => idGenerator.generate(IDType.NOTE),
  tag: () => idGenerator.generate(IDType.TAG),
  category: () => idGenerator.generate(IDType.CATEGORY),
  saveRecord: () => idGenerator.generate(IDType.SAVE_RECORD),
  
  // 画布系统相关
  canvasCard: () => idGenerator.generate(IDType.CANVAS_CARD),
  canvasSession: () => idGenerator.generate(IDType.CANVAS_SESSION),
  connection: () => idGenerator.generate(IDType.CONNECTION),
  
  // 问题节点相关
  questionNode: () => idGenerator.generate(IDType.QUESTION_NODE),
  
  // 输出节点相关
  outputNode: () => idGenerator.generate(IDType.OUTPUT_NODE),
  outputConnection: () => idGenerator.generate(IDType.OUTPUT_CONNECTION),
  
  // 对话消息相关
  chatMessage: () => idGenerator.generate(IDType.CHAT_MESSAGE),
  conversationMessage: () => idGenerator.generate(IDType.CONVERSATION_MESSAGE),
  
  // 界面交互相关
  tab: () => idGenerator.generate(IDType.TAB),
  diffAction: () => idGenerator.generate(IDType.DIFF_ACTION),
  
  // 媒体文件相关
  mediaFile: () => idGenerator.generate(IDType.MEDIA_FILE, IDGenerationMode.SECURE),
  mediaSection: () => idGenerator.generate(IDType.MEDIA_SECTION),
  
  // 节点类型相关
  nodeType: () => idGenerator.generate(IDType.NODE_TYPE),
  dragData: () => idGenerator.generate(IDType.DRAG_DATA),
  
  // 安全UUID
  secure: () => idGenerator.generate(IDType.NOTE, IDGenerationMode.SECURE),
  
  // 简单时间戳
  simple: () => idGenerator.generate(IDType.CHAT_MESSAGE, IDGenerationMode.SIMPLE)
}

// 旧版本兼容性支持
export const legacyIDPatterns = {
  // 检查是否是旧版本ID格式
  isLegacyFormat: (id: string): boolean => {
    // 检查各种旧格式
    const patterns = [
      /^card-\d+-[a-z0-9]+$/,
      /^question-\d+-[a-z0-9]+$/,
      /^output-node-\d+-[a-z0-9]+$/,
      /^msg-\d+-[a-z0-9]+$/,
      /^connection-\d+-[a-z0-9]+$/,
      /^output-conn-\d+-[a-z0-9]+$/,
      /^diff_\d+_[a-z0-9]+$/,
      /^\d+$/  // 纯数字ID
    ]
    
    return patterns.some(pattern => pattern.test(id))
  },
  
  // 迁移旧ID到新格式
  migrate: (oldId: string): string => {
    // 如果已经是新格式，直接返回
    if (!legacyIDPatterns.isLegacyFormat(oldId)) {
      return oldId
    }
    
    // 根据旧ID推断类型并生成新ID
    const type = idGenerator.extractType(oldId)
    if (type) {
      const idType = Object.values(IDType).find(t => t === type)
      if (idType) {
        return idGenerator.generate(idType)
      }
    }
    
    // 默认生成一个通用ID
    return idGenerator.generate(IDType.NOTE)
  }
}