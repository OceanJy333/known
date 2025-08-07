import { RecallService } from '../recallService'
import { KnowledgeNote } from '../recallTypes'

// Mock OpenAI
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn()
        }
      }
    }))
  }
})

describe('RecallService', () => {
  let recallService: RecallService
  let mockKnowledgeBase: KnowledgeNote[]

  beforeEach(() => {
    // Mock environment variables
    process.env.OPENAI_API_KEY = 'test-key'
    process.env.OPENAI_BASE_URL = 'https://api.openai.com/v1'
    process.env.OPENAI_MODEL = 'gpt-4o-mini'

    recallService = new RecallService()
    
    mockKnowledgeBase = [
      {
        id: 'note-1',
        title: 'React Hooks 基础',
        summary: 'React Hooks 是 React 16.8 引入的新特性',
        content: 'useState, useEffect 等钩子函数的使用',
        tags: ['react', 'hooks', 'javascript'],
        category: 'frontend'
      },
      {
        id: 'note-2', 
        title: 'Vue.js 响应式原理',
        summary: 'Vue.js 2.x 和 3.x 的响应式系统对比',
        content: 'Object.defineProperty vs Proxy',
        tags: ['vue', 'reactive', 'javascript'],
        category: 'frontend'
      },
      {
        id: 'note-3',
        title: 'Node.js 性能优化',
        summary: 'Node.js 应用的性能优化技巧',
        content: '内存管理、异步操作优化等',
        tags: ['nodejs', 'performance', 'backend'],
        category: 'backend'
      }
    ]
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('recallCards', () => {
    it('should return empty result when knowledge base is empty', async () => {
      const result = await recallService.recallCards('test question', [])
      
      expect(result.cards).toHaveLength(0)
      expect(result.searchStats.totalNotesSearched).toBe(0)
      expect(result.searchStats.notesFound).toBe(0)
    })

    it('should use fallback keyword matching when AI matching fails', async () => {
      // Mock AI response failure
      const mockOpenAI = require('openai').default
      const mockInstance = new mockOpenAI()
      mockInstance.chat.completions.create.mockRejectedValue(new Error('AI error'))

      const result = await recallService.recallCards('react hooks', mockKnowledgeBase)
      
      expect(result.fallback).toBe(true)
      expect(result.cards.length).toBeGreaterThan(0)
      expect(result.cards[0].reason).toBe('关键词匹配')
      expect(result.cards[0].relevance).toBe(0.7)
    })

    it('should validate recall result correctly', () => {
      const validResult = {
        cards: [
          {
            id: 'note-1',
            title: 'Test Note',
            relevance: 0.8,
            reason: 'Test reason'
          }
        ],
        searchStats: {
          totalNotesSearched: 1,
          notesFound: 1,
          averageRelevance: '0.80'
        }
      }

      const invalidResult = {
        cards: [
          {
            id: 'note-1',
            title: 'Test Note',
            relevance: 1.5, // Invalid relevance > 1
            reason: 'Test reason'
          }
        ],
        searchStats: {
          totalNotesSearched: 1,
          notesFound: 1,
          averageRelevance: '1.50'
        }
      }

      expect(recallService.validateRecallResult(validResult)).toBe(true)
      expect(recallService.validateRecallResult(invalidResult)).toBe(false)
    })
  })

  describe('options handling', () => {
    it('should respect maxResults option', async () => {
      const mockOpenAI = require('openai').default
      const mockInstance = new mockOpenAI()
      mockInstance.chat.completions.create.mockRejectedValue(new Error('AI error'))

      const result = await recallService.recallCards(
        'javascript', 
        mockKnowledgeBase, 
        { maxResults: 2 }
      )
      
      expect(result.cards.length).toBeLessThanOrEqual(2)
    })

    it('should respect relevanceThreshold option', async () => {
      const mockOpenAI = require('openai').default
      const mockInstance = new mockOpenAI()
      mockInstance.chat.completions.create.mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({
              matches: [
                { id: 'note-1', relevance: 0.9, reason: 'High relevance' },
                { id: 'note-2', relevance: 0.4, reason: 'Low relevance' }
              ]
            })
          }
        }]
      })

      const result = await recallService.recallCards(
        'test question', 
        mockKnowledgeBase, 
        { relevanceThreshold: 0.7 }
      )
      
      // Should only include cards with relevance > 0.7
      expect(result.cards.length).toBe(1)
      expect(result.cards[0].relevance).toBe(0.9)
    })
  })
})