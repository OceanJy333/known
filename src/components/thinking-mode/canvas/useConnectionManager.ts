'use client'

import { useState, useCallback, useRef } from 'react'
import { Position } from '@/types/canvas'
import { ConnectionStatus } from '@/types/outputNode'
import { useCanvasStore } from './canvasStore'

interface ConnectionDrag {
  isActive: boolean
  startPoint: Position | null
  startNodeId: string | null
  previewLine: { start: Position; end: Position } | null
}

interface UseConnectionManagerProps {
  canvasRef: React.RefObject<HTMLDivElement | null>
  canvasTransform: { x: number; y: number; scale: number }
}

export function useConnectionManager({ canvasRef, canvasTransform }: UseConnectionManagerProps) {
  const [connectionDrag, setConnectionDrag] = useState<ConnectionDrag>({
    isActive: false,
    startPoint: null,
    startNodeId: null,
    previewLine: null
  })
  
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null)
  const dragCounterRef = useRef(0)

  const {
    addOutputConnection,
    updateOutputConnection,
    removeOutputConnection,
    toggleCardConnection,
    getNodeConnections
  } = useCanvasStore()

  // 将屏幕坐标转换为画布坐标
  const screenToCanvas = useCallback((screenX: number, screenY: number): Position => {
    if (!canvasRef.current) return { x: 0, y: 0 }
    
    const rect = canvasRef.current.getBoundingClientRect()
    const canvasX = (screenX - rect.left - canvasTransform.x) / canvasTransform.scale
    const canvasY = (screenY - rect.top - canvasTransform.y) / canvasTransform.scale
    
    return { x: canvasX, y: canvasY }
  }, [canvasTransform])

  // 开始拖拽连接
  const startConnectionDrag = useCallback((nodeId: string, startPoint: Position) => {
    setConnectionDrag({
      isActive: true,
      startPoint,
      startNodeId: nodeId,
      previewLine: null
    })
  }, [])

  // 更新连接预览
  const updateConnectionPreview = useCallback((e: React.DragEvent | React.MouseEvent) => {
    if (!connectionDrag.isActive || !connectionDrag.startPoint) return

    const currentPoint = screenToCanvas(e.clientX, e.clientY)
    
    setConnectionDrag(prev => ({
      ...prev,
      previewLine: {
        start: prev.startPoint!,
        end: currentPoint
      }
    }))
  }, [connectionDrag.isActive, connectionDrag.startPoint, screenToCanvas])

  // 完成连接创建
  const completeConnection = useCallback((targetNodeId: string, targetPoint: Position) => {
    if (!connectionDrag.isActive || !connectionDrag.startNodeId) return

    // 创建新连接
    const newConnection = {
      fromId: connectionDrag.startNodeId,
      toId: targetNodeId,
      fromType: 'card' as const,
      toType: 'outputNode' as const,
      status: ConnectionStatus.ACTIVE,
      strength: 1.0
    }

    addOutputConnection(newConnection)
    
    // 清除拖拽状态
    setConnectionDrag({
      isActive: false,
      startPoint: null,
      startNodeId: null,
      previewLine: null
    })
  }, [connectionDrag.isActive, connectionDrag.startNodeId, addOutputConnection])

  // 取消连接创建
  const cancelConnection = useCallback(() => {
    setConnectionDrag({
      isActive: false,
      startPoint: null,
      startNodeId: null,
      previewLine: null
    })
  }, [])

  // 切换连接状态
  const toggleConnectionStatus = useCallback((connectionId: string) => {
    const currentConnections = getNodeConnections()
    const connection = currentConnections.find(conn => conn.id === connectionId)
    
    if (!connection) return

    // 状态循环：NEW → ACTIVE → RELATED → DISABLED → 删除
    let newStatus: ConnectionStatus
    switch (connection.status) {
      case ConnectionStatus.NEW:
        newStatus = ConnectionStatus.ACTIVE
        break
      case ConnectionStatus.ACTIVE:
        newStatus = ConnectionStatus.RELATED
        break
      case ConnectionStatus.RELATED:
        newStatus = ConnectionStatus.DISABLED
        break
      case ConnectionStatus.DISABLED:
        // 删除连接
        removeOutputConnection(connectionId)
        // 如果删除的是当前选中的连接，清除选中状态
        if (connectionId === selectedConnectionId) {
          setSelectedConnectionId(null)
        }
        return
      default:
        newStatus = ConnectionStatus.ACTIVE
    }

    updateOutputConnection(connectionId, newStatus)
  }, [getNodeConnections, updateOutputConnection, removeOutputConnection, selectedConnectionId])

  // 删除连接
  const deleteConnection = useCallback((connectionId: string) => {
    removeOutputConnection(connectionId)
    // 如果删除的是当前选中的连接，清除选中状态
    if (connectionId === selectedConnectionId) {
      setSelectedConnectionId(null)
    }
    console.log('✅ 已删除连接:', connectionId)
  }, [removeOutputConnection, selectedConnectionId])

  // 选择连接
  const selectConnection = useCallback((connectionId: string | null) => {
    console.log('🔄 selectConnection:', connectionId)
    setSelectedConnectionId(connectionId)
  }, [])

  // 批量管理连接
  const batchUpdateConnections = useCallback((nodeId: string, status: ConnectionStatus) => {
    const connections = getNodeConnections().filter(conn => 
      conn.fromId === nodeId || conn.toId === nodeId
    )
    
    connections.forEach(conn => {
      updateOutputConnection(conn.id, status)
    })
  }, [getNodeConnections, updateOutputConnection])

  // 获取节点的连接点状态
  const getConnectionPointsStatus = useCallback((nodeId: string) => {
    const connections = getNodeConnections().filter(conn => 
      conn.fromId === nodeId || conn.toId === nodeId
    )
    
    return {
      hasConnections: connections.length > 0,
      activeConnections: connections.filter(conn => conn.status === ConnectionStatus.ACTIVE).length,
      totalConnections: connections.length
    }
  }, [getNodeConnections])

  // 检查是否可以创建连接
  const canCreateConnection = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return false
    
    const connections = getNodeConnections()
    const existingConnection = connections.find(conn => 
      (conn.fromId === fromId && conn.toId === toId) ||
      (conn.fromId === toId && conn.toId === fromId)
    )
    
    return !existingConnection
  }, [getNodeConnections])

  return {
    // 连接拖拽状态
    connectionDrag,
    selectedConnectionId,
    
    // 连接创建
    startConnectionDrag,
    updateConnectionPreview,
    completeConnection,
    cancelConnection,
    canCreateConnection,
    
    // 连接管理
    toggleConnectionStatus,
    deleteConnection,
    selectConnection,
    batchUpdateConnections,
    
    // 状态查询
    getConnectionPointsStatus,
    
    // 工具函数
    screenToCanvas
  }
}