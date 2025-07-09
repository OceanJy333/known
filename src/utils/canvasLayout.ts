import { Position, CANVAS_CONSTANTS, SmartLayoutOptions, CanvasLayoutConfig } from '@/types/canvas'
import { QuestionNodeData } from '@/components/thinking-mode/canvas/QuestionNode'
import { KnowledgeNote } from '@/types/knowledge'

/**
 * 布局节点信息
 */
export interface LayoutNode {
  id: string
  type: 'question' | 'note'
  position: Position
  size: { width: number; height: number }
  isFixed?: boolean // 是否固定位置（用户手动调整过）
  importance?: number // 重要性权重 0-1
  connections?: string[] // 连接的其他节点ID
}

/**
 * 布局结果
 */
export interface LayoutResult {
  nodes: LayoutNode[]
  connections: Array<{
    fromId: string
    toId: string
    strength: number
  }>
  boundingBox: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

/**
 * 画布智能布局算法类
 */
export class CanvasLayoutEngine {
  private config: CanvasLayoutConfig
  private options: SmartLayoutOptions

  constructor(
    config: Partial<CanvasLayoutConfig> = {},
    options: Partial<SmartLayoutOptions> = {}
  ) {
    this.config = {
      centerPosition: { x: 400, y: 300 },
      nodeSpacing: 80,
      radiusIncrement: 150,
      maxRadius: 600,
      preferredAngleOffset: Math.PI / 6, // 30度
      ...config
    }

    this.options = {
      avoidOverlap: true,
      maintainConnections: true,
      animateTransition: true,
      preserveUserPositions: true,
      ...options
    }
  }

  /**
   * 为问题节点和相关笔记生成智能布局
   */
  layoutQuestionWithNotes(
    question: QuestionNodeData,
    relatedNotes: KnowledgeNote[],
    existingNodes: LayoutNode[] = []
  ): LayoutResult {
    console.log('🎯 开始智能布局:', {
      questionId: question.id,
      notesCount: relatedNotes.length,
      existingNodesCount: existingNodes.length
    })

    const nodes: LayoutNode[] = []
    const connections: Array<{ fromId: string; toId: string; strength: number }> = []

    // 1. 确定问题节点位置
    const questionNode = this.createQuestionNode(question, existingNodes)
    nodes.push(questionNode)

    // 2. 如果没有相关笔记，直接返回
    if (relatedNotes.length === 0) {
      return {
        nodes,
        connections,
        boundingBox: this.calculateBoundingBox(nodes)
      }
    }

    // 3. 计算笔记节点的最佳布局
    const noteNodes = this.layoutNotesAroundQuestion(
      questionNode,
      relatedNotes,
      existingNodes
    )
    
    nodes.push(...noteNodes)

    // 4. 创建连接关系
    for (const note of relatedNotes) {
      connections.push({
        fromId: question.id,
        toId: note.id,
        strength: this.calculateConnectionStrength(question, note)
      })
    }

    // 5. 优化布局以避免重叠
    if (this.options.avoidOverlap) {
      this.optimizeLayout(nodes, connections)
    }

    const result = {
      nodes,
      connections,
      boundingBox: this.calculateBoundingBox(nodes)
    }

    console.log('✅ 布局完成:', {
      totalNodes: result.nodes.length,
      connections: result.connections.length,
      boundingBox: result.boundingBox
    })

    return result
  }

  /**
   * 创建问题节点
   */
  private createQuestionNode(
    question: QuestionNodeData,
    existingNodes: LayoutNode[]
  ): LayoutNode {
    // 检查是否已存在且有固定位置
    const existingQuestion = existingNodes.find(n => n.id === question.id && n.type === 'question')
    
    if (existingQuestion && (existingQuestion.isFixed || this.options.preserveUserPositions)) {
      return existingQuestion
    }

    // 计算问题节点的最佳位置
    let position = this.config.centerPosition

    // 如果画布中已有其他节点，避免重叠
    if (existingNodes.length > 0) {
      position = this.findBestPositionForNode(
        {
          width: CANVAS_CONSTANTS.QUESTION_NODE_WIDTH,
          height: CANVAS_CONSTANTS.QUESTION_NODE_HEIGHT
        },
        existingNodes
      )
    }

    return {
      id: question.id,
      type: 'question',
      position,
      size: {
        width: CANVAS_CONSTANTS.QUESTION_NODE_WIDTH,
        height: CANVAS_CONSTANTS.QUESTION_NODE_HEIGHT
      },
      importance: 1.0, // 问题节点总是最重要的
      connections: []
    }
  }

  /**
   * 围绕问题节点布局相关笔记
   */
  private layoutNotesAroundQuestion(
    questionNode: LayoutNode,
    relatedNotes: KnowledgeNote[],
    existingNodes: LayoutNode[]
  ): LayoutNode[] {
    const nodes: LayoutNode[] = []
    
    // 按重要性排序笔记
    const sortedNotes = this.sortNotesByImportance(relatedNotes)
    
    // 使用圆形布局算法
    const layoutPositions = this.calculateCircularLayout(
      questionNode.position,
      sortedNotes.length,
      this.config.radiusIncrement
    )

    for (let i = 0; i < sortedNotes.length; i++) {
      const note = sortedNotes[i]
      
      // 检查是否已存在且有固定位置
      const existingNote = existingNodes.find(n => n.id === note.id && n.type === 'note')
      
      if (existingNote && (existingNote.isFixed || this.options.preserveUserPositions)) {
        nodes.push(existingNote)
        continue
      }

      // 计算最佳位置
      let position = layoutPositions[i]
      
      // 微调位置以避免与现有节点重叠
      if (this.options.avoidOverlap) {
        position = this.adjustPositionToAvoidOverlap(
          position,
          { width: 280, height: 200 }, // 标准笔记卡片尺寸
          [...existingNodes, ...nodes]
        )
      }

      const noteNode: LayoutNode = {
        id: note.id,
        type: 'note',
        position,
        size: { width: 280, height: 200 },
        importance: this.calculateNoteImportance(note),
        connections: [questionNode.id]
      }

      nodes.push(noteNode)
    }

    return nodes
  }

  /**
   * 计算圆形布局位置
   */
  private calculateCircularLayout(
    center: Position,
    nodeCount: number,
    radius: number
  ): Position[] {
    const positions: Position[] = []
    
    if (nodeCount === 0) return positions

    // 单个节点放在右侧
    if (nodeCount === 1) {
      return [{
        x: center.x + radius,
        y: center.y
      }]
    }

    // 多个节点使用圆形分布
    const angleStep = (2 * Math.PI) / nodeCount
    const startAngle = -Math.PI / 2 // 从顶部开始

    for (let i = 0; i < nodeCount; i++) {
      const angle = startAngle + i * angleStep
      const x = center.x + radius * Math.cos(angle)
      const y = center.y + radius * Math.sin(angle)
      
      positions.push({ x, y })
    }

    return positions
  }

  /**
   * 按重要性排序笔记
   */
  private sortNotesByImportance(notes: KnowledgeNote[]): KnowledgeNote[] {
    return [...notes].sort((a, b) => {
      // 综合评分：访问次数 + 评分 + 是否收藏
      const scoreA = (a.accessCount || 0) * 0.3 + 
                    (a.rating || 0) * 0.4 + 
                    (a.isFavorite ? 0.3 : 0)
      
      const scoreB = (b.accessCount || 0) * 0.3 + 
                    (b.rating || 0) * 0.4 + 
                    (b.isFavorite ? 0.3 : 0)
      
      return scoreB - scoreA
    })
  }

  /**
   * 计算笔记重要性
   */
  private calculateNoteImportance(note: KnowledgeNote): number {
    let importance = 0.5 // 基础重要性
    
    // 访问次数影响
    importance += Math.min((note.accessCount || 0) / 100, 0.2)
    
    // 评分影响
    if (note.rating) {
      importance += (note.rating / 5) * 0.2
    }
    
    // 收藏状态
    if (note.isFavorite) {
      importance += 0.1
    }
    
    return Math.min(importance, 1.0)
  }

  /**
   * 计算连接强度
   */
  private calculateConnectionStrength(question: QuestionNodeData, note: KnowledgeNote): number {
    // 基础强度
    let strength = 0.5
    
    // 基于关键词匹配
    if (question.keywords && note.tags) {
      const matchingKeywords = question.keywords.filter(keyword =>
        note.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
      )
      strength += (matchingKeywords.length / question.keywords.length) * 0.3
    }
    
    // 基于笔记质量
    if (note.rating) {
      strength += (note.rating / 5) * 0.2
    }
    
    return Math.min(strength, 1.0)
  }

  /**
   * 寻找节点的最佳位置
   */
  private findBestPositionForNode(
    nodeSize: { width: number; height: number },
    existingNodes: LayoutNode[]
  ): Position {
    const center = this.config.centerPosition
    const searchRadius = 300
    const step = 50

    // 从中心开始螺旋搜索
    for (let radius = step; radius <= searchRadius; radius += step) {
      for (let angle = 0; angle < 360; angle += 30) {
        const x = center.x + radius * Math.cos(angle * Math.PI / 180)
        const y = center.y + radius * Math.sin(angle * Math.PI / 180)
        
        if (!this.hasOverlap({ x, y }, nodeSize, existingNodes)) {
          return { x, y }
        }
      }
    }

    // 如果找不到合适位置，放在右侧
    return {
      x: center.x + searchRadius,
      y: center.y
    }
  }

  /**
   * 调整位置以避免重叠
   */
  private adjustPositionToAvoidOverlap(
    position: Position,
    nodeSize: { width: number; height: number },
    existingNodes: LayoutNode[]
  ): Position {
    if (!this.hasOverlap(position, nodeSize, existingNodes)) {
      return position
    }

    // 尝试在原位置周围找到最近的无重叠位置
    const searchRadius = 100
    const step = 20

    for (let radius = step; radius <= searchRadius; radius += step) {
      for (let angle = 0; angle < 360; angle += 45) {
        const x = position.x + radius * Math.cos(angle * Math.PI / 180)
        const y = position.y + radius * Math.sin(angle * Math.PI / 180)
        
        if (!this.hasOverlap({ x, y }, nodeSize, existingNodes)) {
          return { x, y }
        }
      }
    }

    return position // 如果实在找不到，保持原位置
  }

  /**
   * 检查是否与现有节点重叠
   */
  private hasOverlap(
    position: Position,
    nodeSize: { width: number; height: number },
    existingNodes: LayoutNode[]
  ): boolean {
    const margin = this.config.nodeSpacing

    for (const node of existingNodes) {
      const horizontalOverlap = 
        position.x < node.position.x + node.size.width + margin &&
        position.x + nodeSize.width + margin > node.position.x

      const verticalOverlap = 
        position.y < node.position.y + node.size.height + margin &&
        position.y + nodeSize.height + margin > node.position.y

      if (horizontalOverlap && verticalOverlap) {
        return true
      }
    }

    return false
  }

  /**
   * 优化整体布局
   */
  private optimizeLayout(nodes: LayoutNode[], connections: Array<{ fromId: string; toId: string; strength: number }>): void {
    // 使用简单的力导向算法进行布局优化
    const iterations = 50
    const repulsionForce = 5000
    const attractionForce = 0.1
    const damping = 0.9

    for (let iter = 0; iter < iterations; iter++) {
      const forces: Record<string, { x: number; y: number }> = {}

      // 初始化力
      for (const node of nodes) {
        forces[node.id] = { x: 0, y: 0 }
      }

      // 计算排斥力
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeA = nodes[i]
          const nodeB = nodes[j]
          
          if (nodeA.isFixed || nodeB.isFixed) continue

          const dx = nodeB.position.x - nodeA.position.x
          const dy = nodeB.position.y - nodeA.position.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1

          const force = repulsionForce / (distance * distance)
          const fx = (dx / distance) * force
          const fy = (dy / distance) * force

          forces[nodeA.id].x -= fx
          forces[nodeA.id].y -= fy
          forces[nodeB.id].x += fx
          forces[nodeB.id].y += fy
        }
      }

      // 计算吸引力（基于连接）
      for (const connection of connections) {
        const nodeA = nodes.find(n => n.id === connection.fromId)
        const nodeB = nodes.find(n => n.id === connection.toId)
        
        if (!nodeA || !nodeB || nodeA.isFixed || nodeB.isFixed) continue

        const dx = nodeB.position.x - nodeA.position.x
        const dy = nodeB.position.y - nodeA.position.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1

        const force = attractionForce * connection.strength * distance
        const fx = (dx / distance) * force
        const fy = (dy / distance) * force

        forces[nodeA.id].x += fx
        forces[nodeA.id].y += fy
        forces[nodeB.id].x -= fx
        forces[nodeB.id].y -= fy
      }

      // 应用力并更新位置
      for (const node of nodes) {
        if (node.isFixed) continue

        const force = forces[node.id]
        node.position.x += force.x * damping
        node.position.y += force.y * damping
      }
    }
  }

  /**
   * 计算边界框
   */
  private calculateBoundingBox(nodes: LayoutNode[]): { minX: number; maxX: number; minY: number; maxY: number } {
    if (nodes.length === 0) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 }
    }

    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity

    for (const node of nodes) {
      minX = Math.min(minX, node.position.x)
      maxX = Math.max(maxX, node.position.x + node.size.width)
      minY = Math.min(minY, node.position.y)
      maxY = Math.max(maxY, node.position.y + node.size.height)
    }

    return { minX, maxX, minY, maxY }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<CanvasLayoutConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * 更新选项
   */
  updateOptions(newOptions: Partial<SmartLayoutOptions>): void {
    this.options = { ...this.options, ...newOptions }
  }
}

/**
 * 创建默认布局引擎实例
 */
export function createLayoutEngine(
  config?: Partial<CanvasLayoutConfig>,
  options?: Partial<SmartLayoutOptions>
): CanvasLayoutEngine {
  return new CanvasLayoutEngine(config, options)
}

/**
 * 快速布局函数
 */
export function quickLayout(
  question: QuestionNodeData,
  relatedNotes: KnowledgeNote[],
  centerPosition?: Position
): LayoutResult {
  const layoutEngine = createLayoutEngine({
    centerPosition: centerPosition || { x: 400, y: 300 }
  })
  
  return layoutEngine.layoutQuestionWithNotes(question, relatedNotes)
}