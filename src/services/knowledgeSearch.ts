import { KnowledgeNote, SearchResult, SearchFilters } from '@/types/knowledge'

export interface SearchOptions {
  maxResults?: number
  minRelevanceScore?: number
  includeContent?: boolean
  searchModes?: ('semantic' | 'keyword' | 'tag' | 'category')[]
}

export interface KeywordAnalysis {
  keywords: string[]
  semantic_intent: string
  search_concepts: string[]
  question_type: string
}

/**
 * 知识库搜索服务
 * 提供多种搜索模式：语义搜索、关键词匹配、标签搜索等
 */
export class KnowledgeSearchService {
  private knowledgeBase: KnowledgeNote[] = []

  constructor(knowledgeBase: KnowledgeNote[] = []) {
    this.knowledgeBase = knowledgeBase
  }

  /**
   * 更新知识库
   */
  updateKnowledgeBase(notes: KnowledgeNote[]) {
    this.knowledgeBase = notes
    console.log(`📚 知识库已更新，共 ${notes.length} 条笔记`)
  }

  /**
   * 基于关键词分析搜索相关笔记
   */
  async searchByKeywords(
    keywordAnalysis: KeywordAnalysis,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    const {
      maxResults = 5,
      minRelevanceScore = 0.3,
      searchModes = ['semantic', 'keyword', 'tag', 'category']
    } = options

    console.log('🔍 开始搜索相关笔记:', {
      keywords: keywordAnalysis.keywords,
      intent: keywordAnalysis.semantic_intent,
      modesCount: searchModes.length,
      knowledgeBaseSize: this.knowledgeBase.length
    })

    const results: SearchResult[] = []

    for (const note of this.knowledgeBase) {
      let totalScore = 0
      let matchHighlights: string[] = []
      let matchReasons: string[] = []

      // 关键词匹配
      if (searchModes.includes('keyword')) {
        const keywordScore = this.calculateKeywordScore(note, keywordAnalysis.keywords, matchHighlights, matchReasons)
        totalScore += keywordScore * 0.4
      }

      // 语义匹配（基于概念和意图）
      if (searchModes.includes('semantic')) {
        const semanticScore = this.calculateSemanticScore(note, keywordAnalysis, matchHighlights, matchReasons)
        totalScore += semanticScore * 0.3
      }

      // 标签匹配
      if (searchModes.includes('tag')) {
        const tagScore = this.calculateTagScore(note, keywordAnalysis.keywords, matchHighlights, matchReasons)
        totalScore += tagScore * 0.2
      }

      // 分类匹配
      if (searchModes.includes('category')) {
        const categoryScore = this.calculateCategoryScore(note, keywordAnalysis.search_concepts, matchHighlights, matchReasons)
        totalScore += categoryScore * 0.1
      }

      // 如果分数超过阈值，添加到结果中
      if (totalScore >= minRelevanceScore) {
        results.push({
          note,
          matchScore: Math.min(totalScore, 1), // 确保分数不超过1
          matchHighlights: [...new Set(matchHighlights)], // 去重
          matchReason: matchReasons.join('; ')
        })
      }
    }

    // 按相关性分数排序并限制结果数量
    const sortedResults = results
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, maxResults)

    console.log(`✅ 搜索完成，找到 ${sortedResults.length} 条相关笔记`)
    
    return sortedResults
  }

  /**
   * 计算关键词匹配分数
   */
  private calculateKeywordScore(
    note: KnowledgeNote,
    keywords: string[],
    highlights: string[],
    reasons: string[]
  ): number {
    let score = 0
    const searchTexts = [
      note.title,
      note.summary,
      note.content,
      ...note.keyPoints
    ].join(' ').toLowerCase()

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase()
      
      // 标题匹配（权重最高）
      if (note.title.toLowerCase().includes(keywordLower)) {
        score += 0.4
        highlights.push(`标题包含"${keyword}"`)
        reasons.push(`标题匹配`)
      }
      
      // 摘要匹配
      if (note.summary.toLowerCase().includes(keywordLower)) {
        score += 0.3
        highlights.push(`摘要包含"${keyword}"`)
        reasons.push(`摘要匹配`)
      }
      
      // 关键要点匹配
      const matchedKeyPoints = note.keyPoints.filter(point => 
        point.toLowerCase().includes(keywordLower)
      )
      if (matchedKeyPoints.length > 0) {
        score += 0.2 * matchedKeyPoints.length
        highlights.push(...matchedKeyPoints.slice(0, 2))
        reasons.push(`关键要点匹配`)
      }
      
      // 内容匹配（权重较低）
      if (note.content.toLowerCase().includes(keywordLower)) {
        score += 0.1
        reasons.push(`内容匹配`)
      }
    }

    return Math.min(score / keywords.length, 1) // 标准化分数
  }

  /**
   * 计算语义匹配分数
   */
  private calculateSemanticScore(
    note: KnowledgeNote,
    analysis: KeywordAnalysis,
    highlights: string[],
    reasons: string[]
  ): number {
    let score = 0

    // 基于问题类型的匹配
    const questionTypeWords = this.getQuestionTypeWords(analysis.question_type)
    const noteText = [note.title, note.summary].join(' ').toLowerCase()
    
    for (const word of questionTypeWords) {
      if (noteText.includes(word.toLowerCase())) {
        score += 0.2
        reasons.push(`问题类型匹配`)
        break
      }
    }

    // 搜索概念匹配
    for (const concept of analysis.search_concepts) {
      if (noteText.includes(concept.toLowerCase())) {
        score += 0.3
        highlights.push(`概念匹配: ${concept}`)
        reasons.push(`概念相关`)
      }
    }

    // 语义意图匹配（基于关键词）
    const intentWords = analysis.semantic_intent.toLowerCase().split(/\s+/)
    let intentMatches = 0
    for (const word of intentWords) {
      if (word.length > 2 && noteText.includes(word)) {
        intentMatches++
      }
    }
    
    if (intentMatches > 0) {
      score += (intentMatches / intentWords.length) * 0.5
      reasons.push(`语义意图匹配`)
    }

    return Math.min(score, 1)
  }

  /**
   * 计算标签匹配分数
   */
  private calculateTagScore(
    note: KnowledgeNote,
    keywords: string[],
    highlights: string[],
    reasons: string[]
  ): number {
    let score = 0
    const noteTags = note.tags.map(tag => tag.toLowerCase())

    for (const keyword of keywords) {
      const keywordLower = keyword.toLowerCase()
      
      // 精确标签匹配
      if (noteTags.includes(keywordLower)) {
        score += 0.8
        highlights.push(`标签: ${keyword}`)
        reasons.push(`标签精确匹配`)
      }
      
      // 标签包含匹配
      const containingTags = noteTags.filter(tag => tag.includes(keywordLower))
      if (containingTags.length > 0) {
        score += 0.4 * containingTags.length
        highlights.push(...containingTags.map(tag => `标签: ${tag}`))
        reasons.push(`标签部分匹配`)
      }
    }

    return Math.min(score / Math.max(keywords.length, 1), 1)
  }

  /**
   * 计算分类匹配分数
   */
  private calculateCategoryScore(
    note: KnowledgeNote,
    searchConcepts: string[],
    highlights: string[],
    reasons: string[]
  ): number {
    let score = 0
    const categoryLower = note.category.toLowerCase()

    for (const concept of searchConcepts) {
      const conceptLower = concept.toLowerCase()
      
      if (categoryLower.includes(conceptLower) || conceptLower.includes(categoryLower)) {
        score += 0.6
        highlights.push(`分类: ${note.category}`)
        reasons.push(`分类匹配`)
        break
      }
    }

    return score
  }

  /**
   * 根据问题类型获取相关词汇
   */
  private getQuestionTypeWords(questionType: string): string[] {
    const typeWordsMap: Record<string, string[]> = {
      'how-to': ['方法', '如何', '步骤', '流程', '实践', '技巧'],
      'what-is': ['定义', '概念', '介绍', '解释', '原理'],
      'analysis': ['分析', '研究', '评估', '比较', '调研'],
      'comparison': ['对比', '比较', '差异', '优缺点', '选择'],
      'best-practice': ['最佳', '实践', '经验', '案例', '建议'],
      'general': ['方法', '原理', '实践', '技巧', '经验']
    }

    return typeWordsMap[questionType] || typeWordsMap['general']
  }

  /**
   * 简单的文本搜索（备用方法）
   */
  simpleTextSearch(query: string, maxResults: number = 5): SearchResult[] {
    const queryLower = query.toLowerCase()
    const results: SearchResult[] = []

    for (const note of this.knowledgeBase) {
      let score = 0
      const highlights: string[] = []

      // 简单的文本匹配
      if (note.title.toLowerCase().includes(queryLower)) {
        score += 0.5
        highlights.push(note.title)
      }
      
      if (note.summary.toLowerCase().includes(queryLower)) {
        score += 0.3
        highlights.push('摘要匹配')
      }

      if (score > 0) {
        results.push({
          note,
          matchScore: score,
          matchHighlights: highlights,
          matchReason: '文本匹配'
        })
      }
    }

    return results
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, maxResults)
  }

  /**
   * 获取知识库统计信息
   */
  getKnowledgeBaseStats() {
    return {
      totalNotes: this.knowledgeBase.length,
      categories: [...new Set(this.knowledgeBase.map(n => n.category))],
      tags: [...new Set(this.knowledgeBase.flatMap(n => n.tags))],
      avgWordCount: this.knowledgeBase.reduce((sum, n) => sum + n.wordCount, 0) / this.knowledgeBase.length
    }
  }
}