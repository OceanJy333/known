import OpenAI from 'openai'
import { RecalledCard, RecallResult, RecallOptions, KnowledgeNote } from './recallTypes'

export class RecallService {
  private openai: OpenAI

  constructor() {
    // 确保环境变量已加载
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    
    this.openai = new OpenAI({
      apiKey: apiKey,
      baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1'
    })
  }

  /**
   * 根据问题智能召回相关卡片
   */
  async recallCards(
    question: string,
    knowledgeBase: KnowledgeNote[],
    options: RecallOptions = {}
  ): Promise<RecallResult> {
    const {
      maxResults = 5,
      relevanceThreshold = 0.6,
      maxKnowledgeBaseSize = 50,
      summaryMaxLength = 200
    } = options

    try {
      // 优化知识库数据，避免token超限
      const optimizedKnowledgeBase = knowledgeBase
        .slice(0, maxKnowledgeBaseSize)
        .map(note => ({
          id: note.id,
          title: note.title,
          summary: (note.summary || '').slice(0, summaryMaxLength),
          tags: note.tags,
          category: note.category
        }))

      const matchingPrompt = `作为知识检索专家，请从用户的笔记库中找出与问题最相关的笔记。

用户问题：${question}

笔记库：
${JSON.stringify(optimizedKnowledgeBase, null, 2)}

请分析每个笔记与问题的相关度，返回最相关的${maxResults}个笔记ID及其相关度评分（0-1）。

返回格式（必须是有效的JSON）：
{
  "matches": [
    {"id": "note-id", "relevance": 0.95, "reason": "相关原因"}
  ]
}`

      const matchingResponse = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: matchingPrompt }],
        temperature: 0.1,
        max_tokens: 1000
      })

      const matchingResult = matchingResponse.choices[0]?.message?.content
      if (!matchingResult) {
        throw new Error('AI匹配返回为空')
      }

      // 解析匹配结果
      let matchingData
      try {
        matchingData = JSON.parse(matchingResult)
      } catch (e) {
        console.warn('⚠️ [召回] JSON解析失败，尝试提取:', matchingResult)
        // 尝试提取JSON部分
        const jsonMatch = matchingResult.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          matchingData = JSON.parse(jsonMatch[0])
        } else {
          throw new Error('无法解析AI返回的匹配结果')
        }
      }

      // 处理召回的卡片
      const recalledCards = matchingData.matches
        ?.filter((match: any) => match.relevance > relevanceThreshold)
        ?.map((match: any) => {
          const originalNote = knowledgeBase.find(note => note.id === match.id)
          return originalNote ? { 
            ...originalNote, 
            relevance: match.relevance, 
            reason: match.reason 
          } : null
        })
        ?.filter(Boolean) || []

      const result: RecallResult = {
        cards: recalledCards,
        searchStats: {
          totalNotesSearched: knowledgeBase.length,
          notesFound: recalledCards.length,
          averageRelevance: recalledCards.length > 0 
            ? (recalledCards.reduce((sum: number, card: any) => sum + card.relevance, 0) / recalledCards.length).toFixed(2)
            : '0'
        }
      }

      console.log('✅ [召回服务] 智能召回完成:', {
        question: question.slice(0, 50) + '...',
        recalledCount: recalledCards.length,
        averageRelevance: result.searchStats.averageRelevance
      })

      return result

    } catch (error) {
      console.error('❌ [召回服务] 智能匹配失败:', error)
      
      // 回退到关键词匹配
      console.log('🔄 [召回服务] 回退到关键词匹配')
      return this.fallbackKeywordRecall(question, knowledgeBase, { maxResults, relevanceThreshold })
    }
  }

  /**
   * 关键词匹配召回（回退方案）
   */
  private fallbackKeywordRecall(
    question: string,
    knowledgeBase: KnowledgeNote[],
    options: { maxResults: number; relevanceThreshold: number }
  ): RecallResult {
    const fallbackCards = knowledgeBase
      .filter(note => {
        const content = `${note.title} ${note.summary || ''} ${note.tags?.join(' ') || ''}`.toLowerCase()
        const questionWords = question.toLowerCase().split(' ')
        return questionWords.some(word => word.length > 2 && content.includes(word))
      })
      .slice(0, options.maxResults)
      .map(note => ({ 
        ...note, 
        relevance: 0.7, 
        reason: '关键词匹配' 
      }))

    const result: RecallResult = {
      cards: fallbackCards,
      searchStats: {
        totalNotesSearched: knowledgeBase.length,
        notesFound: fallbackCards.length,
        averageRelevance: '0.70'
      },
      fallback: true
    }

    console.log('📋 [召回服务] 关键词匹配完成:', {
      question: question.slice(0, 50) + '...',
      recalledCount: fallbackCards.length
    })

    return result
  }

  /**
   * 验证召回结果的质量
   */
  validateRecallResult(result: RecallResult): boolean {
    if (!result.cards || result.cards.length === 0) {
      return false
    }

    // 检查每个卡片是否有必要的字段
    return result.cards.every(card => 
      card.id && 
      card.title && 
      typeof card.relevance === 'number' && 
      card.relevance >= 0 && 
      card.relevance <= 1
    )
  }
}

// 导出单例实例（延迟初始化）
let _recallService: RecallService | null = null

export const getRecallService = (): RecallService => {
  if (!_recallService) {
    _recallService = new RecallService()
  }
  return _recallService
}

// 为了向后兼容，导出一个getter
export const recallService = {
  recallCards: async (...args: Parameters<RecallService['recallCards']>) => {
    return getRecallService().recallCards(...args)
  },
  validateRecallResult: (...args: Parameters<RecallService['validateRecallResult']>) => {
    return getRecallService().validateRecallResult(...args)
  }
}