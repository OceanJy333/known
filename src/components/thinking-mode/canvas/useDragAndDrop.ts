'use client'

import { useState, useCallback, useRef } from 'react'
import { Position } from '@/types/canvas'
import { KnowledgeNote } from '@/types/knowledge'
interface UseDragAndDropProps {
  canvasRef: React.RefObject<HTMLDivElement | null>
  canvasTransform: { x: number; y: number; scale: number }
  onDropNote: (note: KnowledgeNote, position: Position) => void
  onDropNode: (nodeTypeId: string, position: Position) => void
}

interface UseDragAndDropReturn {
  isDraggingOver: boolean
  dropIndicatorPos: Position | null
  handleDragOver: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
}

export function useDragAndDrop({
  canvasRef,
  canvasTransform,
  onDropNote,
  onDropNode
}: UseDragAndDropProps): UseDragAndDropReturn {
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [dropIndicatorPos, setDropIndicatorPos] = useState<Position | null>(null)
  const dragCounterRef = useRef(0)

  // 将屏幕坐标转换为画布坐标
  const screenToCanvas = useCallback((screenX: number, screenY: number): Position => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    
    const rect = canvasRef.current.getBoundingClientRect()
    const canvasX = (screenX - rect.left - canvasTransform.x) / canvasTransform.scale
    const canvasY = (screenY - rect.top - canvasTransform.y) / canvasTransform.scale
    
    return { x: canvasX, y: canvasY }
  }, [canvasTransform])

  // 处理拖拽进入
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // 检查是否包含支持的数据类型
    const types = Array.from(e.dataTransfer.types)
    const hasValidData = types.some(type => 
      type === 'application/x-knowledge-note' || 
      type === 'application/x-canvas-node'
    )
    
    if (!hasValidData) return

    // 设置拖拽状态
    if (!isDraggingOver) {
      setIsDraggingOver(true)
      dragCounterRef.current = 0
    }

    // 更新放置指示器位置
    const canvasPos = screenToCanvas(e.clientX, e.clientY)
    setDropIndicatorPos(canvasPos)

    // 设置拖拽效果
    e.dataTransfer.dropEffect = 'copy'
  }, [isDraggingOver, screenToCanvas])

  // 处理拖拽离开
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    dragCounterRef.current--
    
    // 只有当完全离开画布区域时才清除状态
    if (dragCounterRef.current <= 0) {
      setIsDraggingOver(false)
      setDropIndicatorPos(null)
      dragCounterRef.current = 0
    }
  }, [])

  // 处理放置
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // 清除拖拽状态
    setIsDraggingOver(false)
    setDropIndicatorPos(null)
    dragCounterRef.current = 0

    // 计算放置位置
    const dropPosition = screenToCanvas(e.clientX, e.clientY)

    try {
      // 处理知识笔记放置
      const noteData = e.dataTransfer.getData('application/x-knowledge-note')
      if (noteData) {
        const note: KnowledgeNote = JSON.parse(noteData)
        onDropNote(note, dropPosition)
        return
      }
      
      // 兼容旧版本的拖拽数据格式
      const legacyData = e.dataTransfer.getData('application/json')
      if (legacyData) {
        const dragData = JSON.parse(legacyData)
        
        // 处理笔记拖拽
        if (dragData.type === 'note' && dragData.noteId) {
          // 构造一个简化的KnowledgeNote对象
          const note: Partial<KnowledgeNote> = {
            id: dragData.noteId,
            title: dragData.noteTitle || 'Unknown',
            summary: dragData.noteSummary || '',
            tags: dragData.noteTags || [],
            // 添加其他默认字段
            content: '',
            createdAt: new Date(),
            updatedAt: new Date(),
            wordCount: 0,
            readingTime: 1,
            isFavorite: false,
            accessCount: 0,
            keyPoints: []
          }
          onDropNote(note as KnowledgeNote, dropPosition)
          return
        }
        
        // 处理节点模板拖拽
        if (dragData.type === 'node-template' && dragData.nodeType) {
          console.log('🎯 [拖拽] 创建节点:', dragData.nodeType)
          onDropNode(dragData.nodeType, dropPosition)
          return
        }
      }

      // 处理节点放置
      const nodeData = e.dataTransfer.getData('application/x-canvas-node')
      if (nodeData) {
        const { type } = JSON.parse(nodeData)
        onDropNode(type, dropPosition)
        return
      }
    } catch (error) {
      console.error('处理拖拽放置失败:', error)
    }
  }, [screenToCanvas, onDropNote, onDropNode])

  return {
    isDraggingOver,
    dropIndicatorPos,
    handleDragOver,
    handleDragLeave,
    handleDrop
  }
}