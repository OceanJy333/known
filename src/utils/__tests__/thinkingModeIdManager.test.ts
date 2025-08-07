/**
 * 沉思模式ID管理器测试
 */

import { ThinkingModeIdManager } from '../thinkingModeIdManager'
import { KnowledgeNote } from '@/types/knowledge'
import { CanvasCard } from '@/types/canvas'
import { ConnectionStatus } from '@/types/outputNode'

describe('ThinkingModeIdManager', () => {
  let manager: ThinkingModeIdManager
  
  beforeEach(() => {
    manager = ThinkingModeIdManager.getInstance()
    manager.clear() // 清空之前的测试数据
  })

  describe('注册和管理', () => {
    test('注册知识笔记', () => {
      const note: KnowledgeNote = {
        id: 'note-1',
        title: '测试笔记',
        content: '测试内容',
        summary: '测试摘要',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: 10,
        readingTime: 1,
        isFavorite: false,
        accessCount: 0,
        keyPoints: []
      }

      manager.registerNote(note)
      const info = manager.getRelationshipInfo('note-1')
      expect(info.type).toBe('note')
      expect(info.data).toEqual(note)
    })

    test('注册画布卡片', () => {
      const note: KnowledgeNote = {
        id: 'note-1',
        title: '测试笔记',
        content: '测试内容',
        summary: '测试摘要',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: 10,
        readingTime: 1,
        isFavorite: false,
        accessCount: 0,
        keyPoints: []
      }

      const card: CanvasCard = {
        id: 'card-1',
        noteId: 'note-1',
        position: { x: 0, y: 0 },
        size: { width: 280, height: 200 },
        isSelected: false,
        zIndex: 1,
        addedAt: new Date()
      }

      manager.registerNote(note)
      manager.registerCard(card)

      const cardInfo = manager.getRelationshipInfo('card-1')
      expect(cardInfo.type).toBe('card')
      expect(cardInfo.relations.note).toBe('note-1')

      const noteInfo = manager.getRelationshipInfo('note-1')
      expect(noteInfo.relations.cards).toContain('card-1')
    })

    test('注册输出节点', () => {
      const node = {
        id: 'output-1',
        type: 'ai-chat',
        position: { x: 100, y: 100 },
        status: 'idle'
      }

      manager.registerOutputNode(node)
      const info = manager.getRelationshipInfo('output-1')
      expect(info.type).toBe('outputNode')
      expect(info.data).toEqual(node)
    })

    test('注册连接线', () => {
      const connection = {
        id: 'conn-1',
        fromId: 'output-1',
        toId: 'card-1',
        fromType: 'outputNode',
        toType: 'card',
        status: ConnectionStatus.ACTIVE
      }

      manager.registerConnection(connection)
      const info = manager.getRelationshipInfo('conn-1')
      expect(info.type).toBe('connection')
      expect(info.relations.from).toBe('output-1')
      expect(info.relations.to).toBe('card-1')
    })
  })

  describe('ID验证', () => {
    test('验证有效的ID关系', () => {
      const note: KnowledgeNote = {
        id: 'note-1',
        title: '测试笔记',
        content: '测试内容',
        summary: '测试摘要',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: 10,
        readingTime: 1,
        isFavorite: false,
        accessCount: 0,
        keyPoints: []
      }

      const card: CanvasCard = {
        id: 'card-1',
        noteId: 'note-1',
        position: { x: 0, y: 0 },
        size: { width: 280, height: 200 },
        isSelected: false,
        zIndex: 1,
        addedAt: new Date()
      }

      manager.registerNote(note)
      manager.registerCard(card)

      const result = manager.validateAllRelationships()
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('检测无效的卡片-笔记关系', () => {
      const card: CanvasCard = {
        id: 'card-1',
        noteId: 'note-nonexistent',
        position: { x: 0, y: 0 },
        size: { width: 280, height: 200 },
        isSelected: false,
        zIndex: 1,
        addedAt: new Date()
      }

      manager.registerCard(card)
      const result = manager.validateAllRelationships()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('卡片 card-1 关联的笔记 note-nonexistent 不存在')
    })

    test('检测无效的连接线关系', () => {
      const connection = {
        id: 'conn-1',
        fromId: 'output-nonexistent',
        toId: 'card-nonexistent',
        fromType: 'outputNode',
        toType: 'card',
        status: ConnectionStatus.ACTIVE
      }

      manager.registerConnection(connection)
      const result = manager.validateAllRelationships()
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('连接线 conn-1 的起点 output-nonexistent 不存在')
      expect(result.errors).toContain('连接线 conn-1 的终点 card-nonexistent 不存在')
    })
  })

  describe('自动修复', () => {
    test('修复无效连接线', () => {
      const connection = {
        id: 'conn-1',
        fromId: 'output-nonexistent',
        toId: 'card-nonexistent',
        fromType: 'outputNode',
        toType: 'card',
        status: ConnectionStatus.ACTIVE
      }

      manager.registerConnection(connection)
      const fixResult = manager.autoFixRelationships()
      
      expect(fixResult.fixed).toBe(true)
      expect(fixResult.changes).toHaveLength(1)
      expect(fixResult.changes[0].type).toBe('remove')
      expect(fixResult.changes[0].target).toBe('connection:conn-1')
    })

    test('修复消息中的无效上下文卡片', () => {
      const message = {
        id: 'msg-1',
        contextCards: ['card-1', 'card-nonexistent', 'card-2'],
        content: '测试消息'
      }

      const card: CanvasCard = {
        id: 'card-1',
        noteId: 'note-1',
        position: { x: 0, y: 0 },
        size: { width: 280, height: 200 },
        isSelected: false,
        zIndex: 1,
        addedAt: new Date()
      }

      manager.registerCard(card)
      manager.registerMessage(message)

      const fixResult = manager.autoFixRelationships()
      expect(fixResult.fixed).toBe(true)
      expect(message.contextCards).toEqual(['card-1']) // 无效的卡片被移除
    })
  })

  describe('安全操作', () => {
    test('安全添加卡片', async () => {
      const note: KnowledgeNote = {
        id: 'note-1',
        title: '测试笔记',
        content: '测试内容',
        summary: '测试摘要',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: 10,
        readingTime: 1,
        isFavorite: false,
        accessCount: 0,
        keyPoints: []
      }

      manager.registerNote(note)

      const mockAddCard = jest.fn().mockReturnValue('card-generated-id')
      const cardId = manager.safeAddCard('note-1', { x: 100, y: 100 }, mockAddCard)

      expect(cardId).toBe('card-generated-id')
      expect(mockAddCard).toHaveBeenCalledWith({
        noteId: 'note-1',
        position: { x: 100, y: 100 }
      })
    })

    test('安全添加卡片 - 笔记不存在', async () => {
      const mockAddCard = jest.fn()
      const cardId = manager.safeAddCard('note-nonexistent', { x: 100, y: 100 }, mockAddCard)

      expect(cardId).toBeNull()
      expect(mockAddCard).not.toHaveBeenCalled()
    })

    test('安全创建连接', async () => {
      const node = {
        id: 'output-1',
        type: 'ai-chat',
        position: { x: 100, y: 100 },
        status: 'idle'
      }

      const card: CanvasCard = {
        id: 'card-1',
        noteId: 'note-1',
        position: { x: 0, y: 0 },
        size: { width: 280, height: 200 },
        isSelected: false,
        zIndex: 1,
        addedAt: new Date()
      }

      manager.registerOutputNode(node)
      manager.registerCard(card)

      const mockAddConnection = jest.fn()
      const connectionId = manager.safeCreateConnection('output-1', 'card-1', mockAddConnection)

      expect(connectionId).toMatch(/^conn-\d+-[a-z0-9]+$/)
      expect(mockAddConnection).toHaveBeenCalled()
    })

    test('安全创建连接 - 节点不存在', async () => {
      const mockAddConnection = jest.fn()
      const connectionId = manager.safeCreateConnection('output-nonexistent', 'card-nonexistent', mockAddConnection)

      expect(connectionId).toBeNull()
      expect(mockAddConnection).not.toHaveBeenCalled()
    })
  })

  describe('调试信息', () => {
    test('获取调试信息', () => {
      const note: KnowledgeNote = {
        id: 'note-1',
        title: '测试笔记',
        content: '测试内容',
        summary: '测试摘要',
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: 10,
        readingTime: 1,
        isFavorite: false,
        accessCount: 0,
        keyPoints: []
      }

      const card: CanvasCard = {
        id: 'card-1',
        noteId: 'note-1',
        position: { x: 0, y: 0 },
        size: { width: 280, height: 200 },
        isSelected: false,
        zIndex: 1,
        addedAt: new Date()
      }

      manager.registerNote(note)
      manager.registerCard(card)

      const debugInfo = manager.getDebugInfo()
      expect(debugInfo.counts.notes).toBe(1)
      expect(debugInfo.counts.cards).toBe(1)
      expect(debugInfo.cardToNoteMapping['card-1']).toBe('note-1')
      expect(debugInfo.noteToCardsMapping['note-1']).toContain('card-1')
      expect(debugInfo.validation.valid).toBe(true)
    })
  })
})