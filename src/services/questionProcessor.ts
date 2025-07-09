import { OpenAI } from 'openai'

export interface ProcessedQuestion {
  originalQuestion: string
  normalizedQuestion: string
  keywords: string[]
  semanticIntent: string
  searchConcepts: string[]
  questionType: 'how-to' | 'what-is' | 'analysis' | 'comparison' | 'best-practice' | 'general'
  complexity: 'simple' | 'moderate' | 'complex'
  expectedAnswerType: 'definition' | 'process' | 'list' | 'analysis' | 'mixed'
  relatedDomains: string[]
  confidence: number
}

export interface QuestionContext {
  previousQuestions?: string[]
  userPreferences?: {
    domains: string[]
    complexity: 'beginner' | 'intermediate' | 'expert'
  }
  sessionContext?: {
    activeTopics: string[]
    recentNotes: string[]
  }
}

/**
 * 问题处理服务
 * 负责分析、理解和处理用户问题
 */
export class QuestionProcessorService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * 处理并分析用户问题
   */
  async processQuestion(
    question: string,
    context?: QuestionContext
  ): Promise<ProcessedQuestion> {
    console.log('🤔 开始处理问题:', { 
      questionLength: question.length,
      hasContext: !!context 
    })

    try {
      // 预处理问题
      const normalizedQuestion = this.normalizeQuestion(question)
      
      // 使用AI分析问题
      const analysis = await this.analyzeQuestionWithAI(normalizedQuestion, context)
      
      // 后处理和验证
      const processedQuestion = this.postProcessAnalysis(question, normalizedQuestion, analysis)
      
      console.log('✅ 问题处理完成:', {
        type: processedQuestion.questionType,
        complexity: processedQuestion.complexity,
        keywordCount: processedQuestion.keywords.length,
        confidence: processedQuestion.confidence
      })

      return processedQuestion

    } catch (error) {
      console.error('❌ 问题处理失败:', error)
      
      // 回退到基础分析
      return this.basicQuestionAnalysis(question)
    }
  }

  /**
   * 预处理问题文本
   */
  private normalizeQuestion(question: string): string {
    return question
      .trim()
      .replace(/\s+/g, ' ')  // 标准化空格
      .replace(/[？]/g, '?')  // 统一问号
      .replace(/[！]/g, '!')  // 统一感叹号
  }

  /**
   * 使用AI分析问题
   */
  private async analyzeQuestionWithAI(
    question: string,
    context?: QuestionContext
  ): Promise<any> {
    const systemPrompt = `你是一个问题分析专家，专门分析用户的问题并提取关键信息。

请分析用户的问题，并返回JSON格式的结果：
{
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "semantic_intent": "问题的语义意图描述",
  "search_concepts": ["搜索概念1", "搜索概念2"],
  "question_type": "问题类型",
  "complexity": "问题复杂度",
  "expected_answer_type": "期望的回答类型",
  "related_domains": ["相关领域1", "相关领域2"],
  "confidence": 0.95
}

问题类型说明：
- "how-to": 如何做某事的问题
- "what-is": 询问定义或概念的问题
- "analysis": 需要分析的问题
- "comparison": 比较类问题
- "best-practice": 最佳实践类问题
- "general": 一般性问题

复杂度说明：
- "simple": 简单问题，一般1-2句话能回答
- "moderate": 中等复杂度，需要结构化回答
- "complex": 复杂问题，需要深入分析

回答类型：
- "definition": 定义解释
- "process": 流程步骤
- "list": 列表形式
- "analysis": 分析论述
- "mixed": 混合类型`

    const userPrompt = `请分析以下问题：

问题：${question}

${context?.sessionContext ? `
会话上下文：
- 活跃话题：${context.sessionContext.activeTopics?.join(', ') || '无'}
- 最近笔记：${context.sessionContext.recentNotes?.slice(0, 3).join(', ') || '无'}
` : ''}

${context?.userPreferences ? `
用户偏好：
- 关注领域：${context.userPreferences.domains?.join(', ') || '无'}
- 复杂度偏好：${context.userPreferences.complexity || '未知'}
` : ''}

请提供详细的分析结果。`

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1000
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('AI分析返回空结果')
    }

    return JSON.parse(content)
  }

  /**
   * 后处理AI分析结果
   */
  private postProcessAnalysis(
    originalQuestion: string,
    normalizedQuestion: string,
    analysis: any
  ): ProcessedQuestion {
    return {
      originalQuestion,
      normalizedQuestion,
      keywords: this.validateKeywords(analysis.keywords || []),
      semanticIntent: analysis.semantic_intent || normalizedQuestion,
      searchConcepts: analysis.search_concepts || analysis.keywords || [],
      questionType: this.validateQuestionType(analysis.question_type),
      complexity: this.validateComplexity(analysis.complexity),
      expectedAnswerType: this.validateAnswerType(analysis.expected_answer_type),
      relatedDomains: analysis.related_domains || [],
      confidence: Math.min(Math.max(analysis.confidence || 0.7, 0), 1)
    }
  }

  /**
   * 基础问题分析（备用方法）
   */
  private basicQuestionAnalysis(question: string): ProcessedQuestion {
    const normalizedQuestion = this.normalizeQuestion(question)
    const keywords = this.extractBasicKeywords(normalizedQuestion)
    
    return {
      originalQuestion: question,
      normalizedQuestion,
      keywords,
      semanticIntent: normalizedQuestion,
      searchConcepts: keywords,
      questionType: this.detectBasicQuestionType(normalizedQuestion),
      complexity: this.detectBasicComplexity(normalizedQuestion),
      expectedAnswerType: 'mixed',
      relatedDomains: [],
      confidence: 0.6
    }
  }

  /**
   * 提取基础关键词
   */
  private extractBasicKeywords(question: string): string[] {
    // 移除常见停用词
    const stopWords = ['的', '是', '在', '有', '和', '与', '或', '但', '如何', '什么', '为什么', '怎么', '哪些']
    
    const words = question
      .replace(/[？?！!，,。.；;：:]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1 && !stopWords.includes(word))
      .slice(0, 5) // 最多5个关键词
    
    return [...new Set(words)] // 去重
  }

  /**
   * 检测基础问题类型
   */
  private detectBasicQuestionType(question: string): ProcessedQuestion['questionType'] {
    const questionLower = question.toLowerCase()
    
    if (questionLower.includes('如何') || questionLower.includes('怎么') || questionLower.includes('how')) {
      return 'how-to'
    }
    
    if (questionLower.includes('什么是') || questionLower.includes('什么') || questionLower.includes('what')) {
      return 'what-is'
    }
    
    if (questionLower.includes('分析') || questionLower.includes('为什么') || questionLower.includes('why')) {
      return 'analysis'
    }
    
    if (questionLower.includes('比较') || questionLower.includes('对比') || questionLower.includes('vs')) {
      return 'comparison'
    }
    
    if (questionLower.includes('最佳') || questionLower.includes('推荐') || questionLower.includes('best')) {
      return 'best-practice'
    }
    
    return 'general'
  }

  /**
   * 检测基础复杂度
   */
  private detectBasicComplexity(question: string): ProcessedQuestion['complexity'] {
    if (question.length < 20) return 'simple'
    if (question.length < 50) return 'moderate'
    return 'complex'
  }

  /**
   * 验证关键词数组
   */
  private validateKeywords(keywords: any[]): string[] {
    if (!Array.isArray(keywords)) return []
    return keywords
      .filter(k => typeof k === 'string' && k.trim().length > 0)
      .map(k => k.trim())
      .slice(0, 8) // 限制最多8个关键词
  }

  /**
   * 验证问题类型
   */
  private validateQuestionType(type: any): ProcessedQuestion['questionType'] {
    const validTypes: ProcessedQuestion['questionType'][] = [
      'how-to', 'what-is', 'analysis', 'comparison', 'best-practice', 'general'
    ]
    return validTypes.includes(type) ? type : 'general'
  }

  /**
   * 验证复杂度
   */
  private validateComplexity(complexity: any): ProcessedQuestion['complexity'] {
    const validComplexities: ProcessedQuestion['complexity'][] = ['simple', 'moderate', 'complex']
    return validComplexities.includes(complexity) ? complexity : 'moderate'
  }

  /**
   * 验证答案类型
   */
  private validateAnswerType(type: any): ProcessedQuestion['expectedAnswerType'] {
    const validTypes: ProcessedQuestion['expectedAnswerType'][] = [
      'definition', 'process', 'list', 'analysis', 'mixed'
    ]
    return validTypes.includes(type) ? type : 'mixed'
  }

  /**
   * 生成搜索提示
   */
  generateSearchHints(processed: ProcessedQuestion): string[] {
    const hints: string[] = []

    // 基于问题类型的提示
    switch (processed.questionType) {
      case 'how-to':
        hints.push('寻找包含步骤、方法、流程的笔记')
        break
      case 'what-is':
        hints.push('寻找包含定义、概念解释的笔记')
        break
      case 'analysis':
        hints.push('寻找包含分析、研究、评估的笔记')
        break
      case 'comparison':
        hints.push('寻找包含对比、比较分析的笔记')
        break
      case 'best-practice':
        hints.push('寻找包含最佳实践、经验总结的笔记')
        break
    }

    // 基于关键词的提示
    if (processed.keywords.length > 0) {
      hints.push(`关键词：${processed.keywords.slice(0, 3).join('、')}`)
    }

    // 基于相关领域的提示
    if (processed.relatedDomains.length > 0) {
      hints.push(`相关领域：${processed.relatedDomains.slice(0, 2).join('、')}`)
    }

    return hints
  }
}