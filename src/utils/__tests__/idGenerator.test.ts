/**
 * ID生成器测试
 */

import { IDGenerator, IDType, IDGenerationMode, generateID, idGenerator } from '../idGenerator'

describe('IDGenerator', () => {
  let generator: IDGenerator

  beforeEach(() => {
    generator = IDGenerator.getInstance()
  })

  describe('基本ID生成', () => {
    test('生成时间戳格式ID', () => {
      const id = generator.generate(IDType.CANVAS_CARD)
      expect(id).toMatch(/^card-\d+-[a-z0-9]+$/)
    })

    test('生成安全UUID格式ID', () => {
      const id = generator.generate(IDType.MEDIA_FILE, IDGenerationMode.SECURE)
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
    })

    test('生成简单时间戳ID', () => {
      const id = generator.generate(IDType.CHAT_MESSAGE, IDGenerationMode.SIMPLE)
      expect(id).toMatch(/^\d+$/)
    })

    test('生成序列ID', () => {
      const id1 = generator.generate(IDType.NODE_TYPE, IDGenerationMode.SEQUENCE)
      const id2 = generator.generate(IDType.NODE_TYPE, IDGenerationMode.SEQUENCE)
      expect(id1).toMatch(/^node-type-1$/)
      expect(id2).toMatch(/^node-type-2$/)
    })
  })

  describe('批量生成', () => {
    test('批量生成唯一ID', () => {
      const ids = generator.generateBatch(IDType.CANVAS_CARD, 5)
      expect(ids).toHaveLength(5)
      
      // 检查所有ID都是唯一的
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(5)
      
      // 检查所有ID都符合格式
      ids.forEach(id => {
        expect(id).toMatch(/^card-\d+-[a-z0-9]+$/)
      })
    })
  })

  describe('ID验证', () => {
    test('验证有效ID', () => {
      const id = generator.generate(IDType.CANVAS_CARD)
      expect(generator.validateID(id)).toBe(true)
      expect(generator.validateID(id, IDType.CANVAS_CARD)).toBe(true)
    })

    test('验证无效ID', () => {
      expect(generator.validateID('')).toBe(false)
      expect(generator.validateID('ab')).toBe(false)
      expect(generator.validateID('invalid-id', IDType.CANVAS_CARD)).toBe(false)
    })
  })

  describe('ID信息提取', () => {
    test('提取ID类型', () => {
      const id = generator.generate(IDType.CANVAS_CARD)
      expect(generator.extractType(id)).toBe('card')
    })

    test('提取时间戳', () => {
      const beforeGenerate = Date.now()
      const id = generator.generate(IDType.CANVAS_CARD)
      const afterGenerate = Date.now()
      
      const timestamp = generator.extractTimestamp(id)
      expect(timestamp).toBeGreaterThanOrEqual(beforeGenerate)
      expect(timestamp).toBeLessThanOrEqual(afterGenerate)
    })
  })

  describe('重试ID生成', () => {
    test('生成重试ID', () => {
      const originalId = generator.generate(IDType.DIFF_ACTION)
      const retryId = generator.generateRetryID(originalId, 1)
      expect(retryId).toMatch(new RegExp(`^${originalId}_retry_1_\\d+$`))
    })
  })
})

describe('便捷方法', () => {
  test('生成各种类型的ID', () => {
    expect(generateID.canvasCard()).toMatch(/^card-\d+-[a-z0-9]+$/)
    expect(generateID.note()).toMatch(/^note-\d+-[a-z0-9]+$/)
    expect(generateID.questionNode()).toMatch(/^question-\d+-[a-z0-9]+$/)
    expect(generateID.outputNode()).toMatch(/^output-\d+-[a-z0-9]+$/)
    expect(generateID.connection()).toMatch(/^conn-\d+-[a-z0-9]+$/)
  })
})

describe('单例模式', () => {
  test('获取相同实例', () => {
    const instance1 = IDGenerator.getInstance()
    const instance2 = IDGenerator.getInstance()
    expect(instance1).toBe(instance2)
  })
})