import { QuestionNodeData } from '@/components/thinking-mode/canvas/QuestionNode'
import { ConnectionData } from '@/components/thinking-mode/canvas/ConnectionLine'
import { KnowledgeNote } from '@/types/knowledge'
import { Position } from '@/types/canvas'

/**
 * 关系强度等级
 */
export type RelationshipStrength = 'weak' | 'moderate' | 'strong' | 'very_strong'

/**
 * 关系映射结果
 */
export interface RelationshipMapping {
  questionId: string
  noteId: string
  relationshipType: 'related' | 'derived' | 'referenced' | 'similar'
  strength: number
  strengthLevel: RelationshipStrength
  evidence: string[]
  confidence: number
}

/**
 * 关系分析结果
 */
export interface RelationshipAnalysis {
  totalRelationships: number
  strongRelationships: number
  averageStrength: number
  topRelationships: RelationshipMapping[]
  relationshipMatrix: Record<string, Record<string, number>>
}

/**
 * 关系映射工具类
 */
export class RelationshipMapper {
  
  /**
   * 分析问题与笔记之间的关系
   */
  analyzeQuestionNoteRelationships(
    question: QuestionNodeData,
    notes: KnowledgeNote[]
  ): RelationshipMapping[] {
    console.log('🔗 开始分析关系映射:', {
      questionId: question.id,
      notesCount: notes.length
    })

    const relationships: RelationshipMapping[] = []

    for (const note of notes) {
      const relationship = this.calculateRelationship(question, note)
      if (relationship.strength > 0.1) { // 只保留有意义的关系
        relationships.push(relationship)
      }
    }

    // 按强度排序
    relationships.sort((a, b) => b.strength - a.strength)

    console.log('✅ 关系分析完成:', {
      totalRelationships: relationships.length,
      averageStrength: relationships.reduce((sum, r) => sum + r.strength, 0) / relationships.length
    })

    return relationships
  }

  /**
   * 计算单个问题与笔记的关系
   */
  private calculateRelationship(
    question: QuestionNodeData,
    note: KnowledgeNote
  ): RelationshipMapping {
    let strength = 0
    const evidence: string[] = []
    let relationshipType: RelationshipMapping['relationshipType'] = 'related'

    // 1. 关键词匹配分析
    const keywordScore = this.analyzeKeywordMatching(question, note, evidence)
    strength += keywordScore * 0.4

    // 2. 语义相似性分析
    const semanticScore = this.analyzeSemanticSimilarity(question, note, evidence)
    strength += semanticScore * 0.3

    // 3. 标签和分类匹配
    const categoryScore = this.analyzeCategoryMatching(question, note, evidence)
    strength += categoryScore * 0.2

    // 4. 内容质量权重
    const qualityScore = this.analyzeContentQuality(note, evidence)
    strength += qualityScore * 0.1

    // 确定关系类型
    relationshipType = this.determineRelationshipType(question, note, strength)

    // 计算置信度
    const confidence = this.calculateConfidence(evidence.length, strength)

    return {
      questionId: question.id,
      noteId: note.id,
      relationshipType,
      strength: Math.min(strength, 1.0),
      strengthLevel: this.getStrengthLevel(strength),
      evidence,
      confidence
    }
  }

  /**
   * 分析关键词匹配
   */
  private analyzeKeywordMatching(
    question: QuestionNodeData,
    note: KnowledgeNote,
    evidence: string[]
  ): number {
    if (!question.keywords || question.keywords.length === 0) {
      return 0
    }

    let score = 0
    const noteText = [note.title, note.summary, ...note.tags, ...note.keyPoints].join(' ').toLowerCase()
    
    for (const keyword of question.keywords) {
      const keywordLower = keyword.toLowerCase()
      
      // 标题匹配（权重最高）
      if (note.title.toLowerCase().includes(keywordLower)) {
        score += 0.3
        evidence.push(`标题包含关键词"${keyword}"`)
      }
      
      // 摘要匹配
      if (note.summary.toLowerCase().includes(keywordLower)) {
        score += 0.2
        evidence.push(`摘要包含关键词"${keyword}"`)
      }
      
      // 标签精确匹配
      if (note.tags.some(tag => tag.toLowerCase() === keywordLower)) {
        score += 0.25
        evidence.push(`标签精确匹配"${keyword}"`)
      }
      
      // 关键要点匹配
      const matchingKeyPoints = note.keyPoints.filter(point => 
        point.toLowerCase().includes(keywordLower)
      )
      if (matchingKeyPoints.length > 0) {
        score += 0.15 * matchingKeyPoints.length
        evidence.push(`关键要点包含"${keyword}"`)
      }
    }

    return Math.min(score / question.keywords.length, 1.0)
  }

  /**
   * 分析语义相似性
   */
  private analyzeSemanticSimilarity(
    question: QuestionNodeData,
    note: KnowledgeNote,
    evidence: string[]
  ): number {
    let score = 0

    // 问题类型与笔记内容的匹配
    const questionText = question.question.toLowerCase()
    const noteContent = [note.title, note.summary].join(' ').toLowerCase()

    // 检测问题类型词汇
    const howToWords = ['如何', '怎么', '方法', '步骤', 'how', 'method', 'step']
    const whatIsWords = ['什么是', '定义', '概念', 'what', 'definition', 'concept']
    const whyWords = ['为什么', '原因', '分析', 'why', 'reason', 'analysis']

    if (howToWords.some(word => questionText.includes(word))) {
      if (noteContent.includes('方法') || noteContent.includes('步骤') || noteContent.includes('流程')) {
        score += 0.4
        evidence.push('问答类型匹配(如何做)')
      }
    }

    if (whatIsWords.some(word => questionText.includes(word))) {
      if (noteContent.includes('定义') || noteContent.includes('概念') || noteContent.includes('介绍')) {
        score += 0.4
        evidence.push('问答类型匹配(概念定义)')
      }
    }

    if (whyWords.some(word => questionText.includes(word))) {
      if (noteContent.includes('原因') || noteContent.includes('分析') || noteContent.includes('研究')) {
        score += 0.4
        evidence.push('问答类型匹配(原因分析)')
      }
    }

    // 主题相关性
    const questionTopics = this.extractTopics(question.question)
    const noteTopics = this.extractTopics(noteContent)
    const commonTopics = questionTopics.filter(topic => noteTopics.includes(topic))
    
    if (commonTopics.length > 0) {
      score += (commonTopics.length / Math.max(questionTopics.length, 1)) * 0.3
      evidence.push(`主题相关性: ${commonTopics.join(', ')}`)
    }

    return Math.min(score, 1.0)
  }

  /**
   * 分析分类匹配
   */
  private analyzeCategoryMatching(
    question: QuestionNodeData,
    note: KnowledgeNote,
    evidence: string[]
  ): number {
    let score = 0

    // 分类相关性
    if (question.keywords) {
      for (const keyword of question.keywords) {
        if (note.category.toLowerCase().includes(keyword.toLowerCase())) {
          score += 0.3
          evidence.push(`分类相关: ${note.category}`)
          break
        }
      }
    }

    // 标签相关性
    if (note.tags.length > 0 && question.keywords) {
      const relevantTags = note.tags.filter(tag =>
        question.keywords!.some(keyword => 
          tag.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(tag.toLowerCase())
        )
      )
      
      if (relevantTags.length > 0) {
        score += (relevantTags.length / note.tags.length) * 0.4
        evidence.push(`相关标签: ${relevantTags.join(', ')}`)
      }
    }

    return Math.min(score, 1.0)
  }

  /**
   * 分析内容质量
   */
  private analyzeContentQuality(
    note: KnowledgeNote,
    evidence: string[]
  ): number {
    let score = 0

    // 评分权重
    if (note.rating && note.rating > 3) {
      score += (note.rating / 5) * 0.4
      evidence.push(`高质量内容(评分${note.rating}/5)`)
    }

    // 收藏状态
    if (note.isFavorite) {
      score += 0.3
      evidence.push('收藏笔记')
    }

    // 访问频次
    if (note.accessCount && note.accessCount > 5) {
      score += Math.min(note.accessCount / 50, 0.3)
      evidence.push(`高访问频次(${note.accessCount}次)`)
    }

    return Math.min(score, 1.0)
  }

  /**
   * 确定关系类型
   */
  private determineRelationshipType(
    question: QuestionNodeData,
    note: KnowledgeNote,
    strength: number
  ): RelationshipMapping['relationshipType'] {
    const questionText = question.question.toLowerCase()
    const noteTitle = note.title.toLowerCase()

    // 如果问题直接引用了笔记标题
    if (questionText.includes(noteTitle) || noteTitle.includes(questionText.slice(0, 20))) {
      return 'referenced'
    }

    // 如果是派生关系（基于某个概念的深入问题）
    if (question.keywords && note.tags.some(tag => 
      question.keywords!.includes(tag) && strength > 0.7
    )) {
      return 'derived'
    }

    // 如果是高度相似
    if (strength > 0.8) {
      return 'similar'
    }

    return 'related'
  }

  /**
   * 计算置信度
   */
  private calculateConfidence(evidenceCount: number, strength: number): number {
    // 基于证据数量和关系强度计算置信度
    const evidenceScore = Math.min(evidenceCount / 5, 1) * 0.4
    const strengthScore = strength * 0.6
    
    return Math.min(evidenceScore + strengthScore, 1.0)
  }

  /**
   * 获取强度等级
   */
  private getStrengthLevel(strength: number): RelationshipStrength {
    if (strength >= 0.8) return 'very_strong'
    if (strength >= 0.6) return 'strong'
    if (strength >= 0.4) return 'moderate'
    return 'weak'
  }

  /**
   * 提取主题词
   */
  private extractTopics(text: string): string[] {
    // 简单的主题词提取（实际项目中可以使用更复杂的NLP算法）
    const topics: string[] = []
    const words = text.toLowerCase().split(/\s+/)
    
    // 过滤停用词并提取有意义的词汇
    const stopWords = ['的', '是', '在', '有', '和', '与', '或', '但', '如何', '什么', '为什么']
    const meaningfulWords = words.filter(word => 
      word.length > 2 && !stopWords.includes(word)
    )

    return meaningfulWords.slice(0, 5) // 最多5个主题词
  }

  /**
   * 生成连接数据
   */
  generateConnections(
    questionPosition: Position,
    questionSize: { width: number; height: number },
    notePositions: Map<string, { position: Position; size: { width: number; height: number } }>,
    relationships: RelationshipMapping[]
  ): ConnectionData[] {
    const connections: ConnectionData[] = []

    for (const relationship of relationships) {
      const noteData = notePositions.get(relationship.noteId)
      if (!noteData) continue

      const connection: ConnectionData = {
        id: `conn-${relationship.questionId}-${relationship.noteId}`,
        fromId: relationship.questionId,
        toId: relationship.noteId,
        fromType: 'question',
        toType: 'note',
        fromPosition: questionPosition,
        toPosition: noteData.position,
        fromSize: questionSize,
        toSize: noteData.size,
        relationshipType: relationship.relationshipType,
        strength: relationship.strength,
        isHighlighted: relationship.strengthLevel === 'very_strong',
        isAnimated: relationship.strengthLevel === 'strong' || relationship.strengthLevel === 'very_strong'
      }

      connections.push(connection)
    }

    return connections
  }

  /**
   * 分析整体关系
   */
  analyzeOverallRelationships(relationships: RelationshipMapping[]): RelationshipAnalysis {
    if (relationships.length === 0) {
      return {
        totalRelationships: 0,
        strongRelationships: 0,
        averageStrength: 0,
        topRelationships: [],
        relationshipMatrix: {}
      }
    }

    const strongRelationships = relationships.filter(r => r.strengthLevel === 'strong' || r.strengthLevel === 'very_strong')
    const averageStrength = relationships.reduce((sum, r) => sum + r.strength, 0) / relationships.length
    const topRelationships = relationships.slice(0, 5)

    // 构建关系矩阵
    const relationshipMatrix: Record<string, Record<string, number>> = {}
    for (const relationship of relationships) {
      if (!relationshipMatrix[relationship.questionId]) {
        relationshipMatrix[relationship.questionId] = {}
      }
      relationshipMatrix[relationship.questionId][relationship.noteId] = relationship.strength
    }

    return {
      totalRelationships: relationships.length,
      strongRelationships: strongRelationships.length,
      averageStrength,
      topRelationships,
      relationshipMatrix
    }
  }
}

/**
 * 创建关系映射器实例
 */
export function createRelationshipMapper(): RelationshipMapper {
  return new RelationshipMapper()
}

/**
 * 快速关系分析函数
 */
export function quickRelationshipAnalysis(
  question: QuestionNodeData,
  notes: KnowledgeNote[]
): RelationshipMapping[] {
  const mapper = createRelationshipMapper()
  return mapper.analyzeQuestionNoteRelationships(question, notes)
}