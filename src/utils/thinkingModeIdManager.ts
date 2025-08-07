/**
 * 沉思模式专用ID管理器
 * 解决ID不对应导致的功能报错问题
 */

import { KnowledgeNote } from '@/types/knowledge'
import { CanvasCard, Position } from '@/types/canvas'
import { ConnectionStatus } from '@/types/outputNode'
import { generateID } from './idGenerator'

// 沉思模式ID类型定义
export interface ThinkingModeIDs {
  cards: Map<string, CanvasCard>          // cardId -> CanvasCard
  notes: Map<string, KnowledgeNote>       // noteId -> KnowledgeNote
  cardToNote: Map<string, string>         // cardId -> noteId
  noteToCards: Map<string, Set<string>>   // noteId -> Set<cardId>
  outputNodes: Map<string, any>           // outputNodeId -> OutputNode
  connections: Map<string, any>           // connectionId -> Connection
  messages: Map<string, any>              // messageId -> Message
}

// ID验证结果
export interface IDValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

// ID关系修复结果
export interface IDRelationshipFixResult {
  fixed: boolean
  changes: Array<{
    type: 'add' | 'remove' | 'update'
    target: string
    oldValue?: any
    newValue?: any
  }>
  errors: string[]
}

export class ThinkingModeIdManager {
  private static instance: ThinkingModeIdManager
  private idRegistry: ThinkingModeIDs
  private debugMode: boolean = false

  private constructor() {
    this.idRegistry = {
      cards: new Map(),
      notes: new Map(),
      cardToNote: new Map(),
      noteToCards: new Map(),
      outputNodes: new Map(),
      connections: new Map(),
      messages: new Map()
    }
  }

  static getInstance(): ThinkingModeIdManager {
    if (!ThinkingModeIdManager.instance) {
      ThinkingModeIdManager.instance = new ThinkingModeIdManager()
    }
    return ThinkingModeIdManager.instance
  }

  // 启用/禁用调试模式
  setDebugMode(enabled: boolean) {
    this.debugMode = enabled
  }

  private log(message: string, ...args: any[]) {
    if (this.debugMode) {
      console.log(`[ThinkingModeIdManager] ${message}`, ...args)
    }
  }

  private warn(message: string, ...args: any[]) {
    console.warn(`[ThinkingModeIdManager] ${message}`, ...args)
  }

  private error(message: string, ...args: any[]) {
    console.error(`[ThinkingModeIdManager] ${message}`, ...args)
  }

  // 注册知识笔记
  registerNote(note: KnowledgeNote): void {
    this.log('注册知识笔记:', note.id)
    this.idRegistry.notes.set(note.id, note)
    
    // 初始化笔记对应的卡片集合
    if (!this.idRegistry.noteToCards.has(note.id)) {
      this.idRegistry.noteToCards.set(note.id, new Set())
    }
  }

  // 注册画布卡片
  registerCard(card: CanvasCard): void {
    this.log('注册画布卡片:', card.id, '-> 笔记:', card.noteId)
    
    // 验证noteId是否存在
    if (!this.idRegistry.notes.has(card.noteId)) {
      this.warn('卡片关联的笔记不存在:', card.noteId)
    }
    
    this.idRegistry.cards.set(card.id, card)
    this.idRegistry.cardToNote.set(card.id, card.noteId)
    
    // 更新笔记到卡片的映射
    const noteCards = this.idRegistry.noteToCards.get(card.noteId) || new Set()
    noteCards.add(card.id)
    this.idRegistry.noteToCards.set(card.noteId, noteCards)
  }

  // 注册输出节点
  registerOutputNode(node: any): void {
    this.log('注册输出节点:', node.id)
    this.idRegistry.outputNodes.set(node.id, node)
  }

  // 注册连接线
  registerConnection(connection: any): void {
    this.log('注册连接线:', connection.id, connection.fromId, '->', connection.toId)
    
    // 验证连接的节点是否存在
    const fromExists = this.idRegistry.outputNodes.has(connection.fromId) || 
                      this.idRegistry.cards.has(connection.fromId)
    const toExists = this.idRegistry.outputNodes.has(connection.toId) || 
                    this.idRegistry.cards.has(connection.toId)
    
    if (!fromExists) {
      this.warn('连接线的起点不存在:', connection.fromId)
    }
    if (!toExists) {
      this.warn('连接线的终点不存在:', connection.toId)
    }
    
    this.idRegistry.connections.set(connection.id, connection)
  }

  // 注册消息
  registerMessage(message: any): void {
    this.log('注册消息:', message.id)
    this.idRegistry.messages.set(message.id, message)
  }

  // 移除注册
  unregisterCard(cardId: string): void {
    this.log('移除卡片注册:', cardId)
    
    const card = this.idRegistry.cards.get(cardId)
    if (card) {
      const noteId = card.noteId
      this.idRegistry.cards.delete(cardId)
      this.idRegistry.cardToNote.delete(cardId)
      
      // 从笔记的卡片集合中移除
      const noteCards = this.idRegistry.noteToCards.get(noteId)
      if (noteCards) {
        noteCards.delete(cardId)
        if (noteCards.size === 0) {
          this.idRegistry.noteToCards.delete(noteId)
        }
      }
    }
  }

  unregisterConnection(connectionId: string): void {
    this.log('移除连接线注册:', connectionId)
    this.idRegistry.connections.delete(connectionId)
  }

  unregisterOutputNode(nodeId: string): void {
    this.log('移除输出节点注册:', nodeId)
    this.idRegistry.outputNodes.delete(nodeId)
  }

  // 验证所有ID关系
  validateAllRelationships(): IDValidationResult {
    const result: IDValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    }

    // 验证卡片-笔记关系
    for (const [cardId, card] of this.idRegistry.cards) {
      if (!this.idRegistry.notes.has(card.noteId)) {
        result.valid = false
        result.errors.push(`卡片 ${cardId} 关联的笔记 ${card.noteId} 不存在`)
      }
    }

    // 验证连接线关系
    for (const [connId, connection] of this.idRegistry.connections) {
      const fromExists = this.idRegistry.outputNodes.has(connection.fromId) || 
                        this.idRegistry.cards.has(connection.fromId)
      const toExists = this.idRegistry.outputNodes.has(connection.toId) || 
                      this.idRegistry.cards.has(connection.toId)
      
      if (!fromExists) {
        result.valid = false
        result.errors.push(`连接线 ${connId} 的起点 ${connection.fromId} 不存在`)
      }
      if (!toExists) {
        result.valid = false
        result.errors.push(`连接线 ${connId} 的终点 ${connection.toId} 不存在`)
      }
    }

    // 验证消息中的上下文卡片
    for (const [msgId, message] of this.idRegistry.messages) {
      if (message.contextCards && Array.isArray(message.contextCards)) {
        for (const cardId of message.contextCards) {
          if (!this.idRegistry.cards.has(cardId)) {
            result.warnings.push(`消息 ${msgId} 的上下文卡片 ${cardId} 不存在`)
          }
        }
      }
    }

    return result
  }

  // 自动修复ID关系
  autoFixRelationships(): IDRelationshipFixResult {
    const result: IDRelationshipFixResult = {
      fixed: false,
      changes: [],
      errors: []
    }

    try {
      // 1. 清理无效的连接线
      const invalidConnections: string[] = []
      
      for (const [connId, connection] of this.idRegistry.connections) {
        const fromExists = this.idRegistry.outputNodes.has(connection.fromId) || 
                          this.idRegistry.cards.has(connection.fromId)
        const toExists = this.idRegistry.outputNodes.has(connection.toId) || 
                        this.idRegistry.cards.has(connection.toId)
        
        if (!fromExists || !toExists) {
          invalidConnections.push(connId)
        }
      }

      // 移除无效连接
      for (const connId of invalidConnections) {
        this.idRegistry.connections.delete(connId)
        result.changes.push({
          type: 'remove',
          target: `connection:${connId}`,
          oldValue: connId
        })
        result.fixed = true
      }

      // 2. 清理消息中的无效上下文卡片
      for (const [msgId, message] of this.idRegistry.messages) {
        if (message.contextCards && Array.isArray(message.contextCards)) {
          const validCards = message.contextCards.filter((cardId: string) => 
            this.idRegistry.cards.has(cardId)
          )
          
          if (validCards.length !== message.contextCards.length) {
            message.contextCards = validCards
            result.changes.push({
              type: 'update',
              target: `message:${msgId}.contextCards`,
              oldValue: message.contextCards,
              newValue: validCards
            })
            result.fixed = true
          }
        }
      }

      this.log('自动修复完成:', result.changes.length, '项更改')
      
    } catch (error) {
      result.errors.push(`自动修复失败: ${error}`)
      this.error('自动修复失败:', error)
    }

    return result
  }

  // 获取ID关系信息
  getRelationshipInfo(id: string): any {
    const info: any = { id, type: 'unknown', relations: {} }

    // 检查是否是卡片ID
    if (this.idRegistry.cards.has(id)) {
      info.type = 'card'
      info.data = this.idRegistry.cards.get(id)
      info.relations.note = this.idRegistry.cardToNote.get(id)
    }

    // 检查是否是笔记ID
    if (this.idRegistry.notes.has(id)) {
      info.type = 'note'
      info.data = this.idRegistry.notes.get(id)
      info.relations.cards = Array.from(this.idRegistry.noteToCards.get(id) || [])
    }

    // 检查是否是输出节点ID
    if (this.idRegistry.outputNodes.has(id)) {
      info.type = 'outputNode'
      info.data = this.idRegistry.outputNodes.get(id)
      info.relations.connections = Array.from(this.idRegistry.connections.values())
        .filter((conn: any) => conn.fromId === id || conn.toId === id)
        .map((conn: any) => conn.id)
    }

    // 检查是否是连接线ID
    if (this.idRegistry.connections.has(id)) {
      info.type = 'connection'
      info.data = this.idRegistry.connections.get(id)
      const conn = info.data
      info.relations.from = conn.fromId
      info.relations.to = conn.toId
    }

    return info
  }

  // 安全地添加卡片到画布
  safeAddCard(noteId: string, position: Position, addCardFn: (params: { noteId: string; position: Position }) => string): string | null {
    try {
      // 验证笔记是否存在
      if (!this.idRegistry.notes.has(noteId)) {
        this.error('尝试添加不存在的笔记为卡片:', noteId)
        return null
      }

      // 检查是否已经有该笔记的卡片
      const existingCards = this.idRegistry.noteToCards.get(noteId)
      if (existingCards && existingCards.size > 0) {
        this.warn('笔记已存在对应的卡片:', noteId, Array.from(existingCards))
        return Array.from(existingCards)[0] // 返回第一个现有卡片ID
      }

      // 调用添加卡片函数
      const cardId = addCardFn({ noteId, position })
      
      // 创建卡片对象并注册
      const card: CanvasCard = {
        id: cardId,
        noteId,
        position,
        size: 'medium',
        isSelected: false,
        zIndex: 1,
        addedAt: new Date()
      }

      this.registerCard(card)
      this.log('安全添加卡片成功:', cardId)
      
      return cardId
    } catch (error) {
      this.error('安全添加卡片失败:', error)
      return null
    }
  }

  // 安全地创建连接线
  safeCreateConnection(
    fromId: string, 
    toId: string, 
    addConnectionFn: (connection: any) => void
  ): string | null {
    try {
      // 验证节点是否存在
      const fromExists = this.idRegistry.outputNodes.has(fromId) || 
                        this.idRegistry.cards.has(fromId)
      const toExists = this.idRegistry.outputNodes.has(toId) || 
                      this.idRegistry.cards.has(toId)

      if (!fromExists) {
        this.error('连接起点不存在:', fromId)
        return null
      }

      if (!toExists) {
        this.error('连接终点不存在:', toId)
        return null
      }

      // 检查是否已存在相同的连接
      const existingConnection = Array.from(this.idRegistry.connections.values())
        .find((conn: any) => conn.fromId === fromId && conn.toId === toId)

      if (existingConnection) {
        this.warn('连接已存在:', fromId, '->', toId)
        return existingConnection.id
      }

      // 创建连接
      const connectionId = generateID.connection()
      const connection = {
        id: connectionId,
        fromId,
        toId,
        fromType: 'outputNode' as const,
        toType: 'card' as const,
        status: ConnectionStatus.ACTIVE,
        strength: 1.0,
        createdAt: new Date()
      }

      addConnectionFn(connection)
      this.registerConnection(connection)
      this.log('安全创建连接成功:', connectionId)
      
      return connectionId
    } catch (error) {
      this.error('安全创建连接失败:', error)
      return null
    }
  }

  // 获取调试信息
  getDebugInfo(): any {
    return {
      counts: {
        cards: this.idRegistry.cards.size,
        notes: this.idRegistry.notes.size,
        outputNodes: this.idRegistry.outputNodes.size,
        connections: this.idRegistry.connections.size,
        messages: this.idRegistry.messages.size
      },
      cardToNoteMapping: Object.fromEntries(this.idRegistry.cardToNote),
      noteToCardsMapping: Object.fromEntries(
        Array.from(this.idRegistry.noteToCards.entries()).map(([noteId, cardIds]) => 
          [noteId, Array.from(cardIds)]
        )
      ),
      validation: this.validateAllRelationships()
    }
  }

  // 清空所有注册
  clear(): void {
    this.idRegistry.cards.clear()
    this.idRegistry.notes.clear()
    this.idRegistry.cardToNote.clear()
    this.idRegistry.noteToCards.clear()
    this.idRegistry.outputNodes.clear()
    this.idRegistry.connections.clear()
    this.idRegistry.messages.clear()
    this.log('清空所有ID注册')
  }
}

// 导出单例实例
export const thinkingModeIdManager = ThinkingModeIdManager.getInstance()

// 便捷的调试工具
export const debugThinkingModeIds = {
  // 启用调试模式
  enable: () => thinkingModeIdManager.setDebugMode(true),
  
  // 禁用调试模式
  disable: () => thinkingModeIdManager.setDebugMode(false),
  
  // 验证并修复所有ID关系
  validateAndFix: () => {
    const validation = thinkingModeIdManager.validateAllRelationships()
    console.log('ID验证结果:', validation)
    
    if (!validation.valid) {
      const fixResult = thinkingModeIdManager.autoFixRelationships()
      console.log('自动修复结果:', fixResult)
      return fixResult
    }
    
    return { fixed: false, message: '无需修复' }
  },
  
  // 获取完整的调试信息
  getInfo: () => thinkingModeIdManager.getDebugInfo(),
  
  // 查看特定ID的关系信息
  inspect: (id: string) => thinkingModeIdManager.getRelationshipInfo(id)
}