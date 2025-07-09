'use client'

import React, { useMemo } from 'react'
import { Position } from '@/types/canvas'

export interface ConnectionData {
  id: string
  fromId: string
  toId: string
  fromType: 'question' | 'note'
  toType: 'question' | 'note'
  fromPosition: Position
  toPosition: Position
  fromSize: { width: number; height: number }
  toSize: { width: number; height: number }
  relationshipType?: 'related' | 'derived' | 'referenced' | 'similar'
  strength?: number // 关系强度 0-1
  isHighlighted?: boolean
  isAnimated?: boolean
}

interface ConnectionLineProps {
  connection: ConnectionData
  canvasOffset?: Position
  onConnectionClick?: (connectionId: string) => void
  onConnectionHover?: (connectionId: string | null) => void
}

export function ConnectionLine({
  connection,
  canvasOffset = { x: 0, y: 0 },
  onConnectionClick,
  onConnectionHover
}: ConnectionLineProps) {
  
  // 计算连接点
  const connectionPoints = useMemo(() => {
    const {
      fromPosition,
      toPosition,
      fromSize,
      toSize
    } = connection

    // 计算两个节点的中心点
    const fromCenter = {
      x: fromPosition.x + fromSize.width / 2,
      y: fromPosition.y + fromSize.height / 2
    }
    
    const toCenter = {
      x: toPosition.x + toSize.width / 2,
      y: toPosition.y + toSize.height / 2
    }

    // 计算连接的最佳边缘点
    const fromEdge = getEdgePoint(fromCenter, toCenter, fromSize)
    const toEdge = getEdgePoint(toCenter, fromCenter, toSize)

    // 调整为相对于画布的坐标
    return {
      from: {
        x: fromPosition.x + fromEdge.x - canvasOffset.x,
        y: fromPosition.y + fromEdge.y - canvasOffset.y
      },
      to: {
        x: toPosition.x + toEdge.x - canvasOffset.x,
        y: toPosition.y + toEdge.y - canvasOffset.y
      }
    }
  }, [connection, canvasOffset])

  // 计算贝塞尔曲线控制点
  const pathData = useMemo(() => {
    const { from, to } = connectionPoints
    
    // 计算距离和方向
    const dx = to.x - from.x
    const dy = to.y - from.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    // 控制点偏移量（根据距离调整）
    const controlOffset = Math.min(distance * 0.4, 120)
    
    // 根据连接方向调整控制点
    let control1: Position
    let control2: Position
    
    if (Math.abs(dx) > Math.abs(dy)) {
      // 水平连接
      control1 = { x: from.x + controlOffset, y: from.y }
      control2 = { x: to.x - controlOffset, y: to.y }
    } else {
      // 垂直连接
      control1 = { x: from.x, y: from.y + controlOffset }
      control2 = { x: to.x, y: to.y - controlOffset }
    }

    return {
      path: `M ${from.x} ${from.y} C ${control1.x} ${control1.y}, ${control2.x} ${control2.y}, ${to.x} ${to.y}`,
      from,
      to,
      control1,
      control2,
      distance
    }
  }, [connectionPoints])

  // 获取连接线样式
  const getConnectionStyle = () => {
    const { relationshipType = 'related', strength = 0.7, isHighlighted = false } = connection
    
    const baseStyles = {
      stroke: '#6b7280',
      strokeWidth: 2,
      opacity: 0.6
    }

    // 根据关系类型调整样式
    switch (relationshipType) {
      case 'related':
        baseStyles.stroke = '#667eea'
        break
      case 'derived':
        baseStyles.stroke = '#10b981'
        baseStyles.strokeWidth = 3
        break
      case 'referenced':
        baseStyles.stroke = '#f59e0b'
        break
      case 'similar':
        baseStyles.stroke = '#8b5cf6'
        break
    }

    // 根据强度调整样式
    baseStyles.strokeWidth = Math.max(1, baseStyles.strokeWidth * strength)
    baseStyles.opacity = Math.max(0.3, baseStyles.opacity * strength)

    // 高亮状态
    if (isHighlighted) {
      baseStyles.strokeWidth += 1
      baseStyles.opacity = Math.min(1, baseStyles.opacity + 0.3)
    }

    return baseStyles
  }

  // 获取箭头标记ID
  const getArrowMarkerId = () => {
    const { relationshipType = 'related' } = connection
    return `arrow-${relationshipType}`
  }

  // 处理点击事件
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onConnectionClick?.(connection.id)
  }

  // 处理悬停事件
  const handleMouseEnter = () => {
    onConnectionHover?.(connection.id)
  }

  const handleMouseLeave = () => {
    onConnectionHover?.(null)
  }

  const style = getConnectionStyle()

  return (
    <g className="connection-line-group">
      {/* 箭头标记定义 */}
      <defs>
        <marker
          id={getArrowMarkerId()}
          markerWidth="10"
          markerHeight="10"
          refX="8"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path
            d="M0,0 L0,6 L9,3 z"
            fill={style.stroke}
            opacity={style.opacity}
          />
        </marker>
      </defs>

      {/* 连接线路径 */}
      <path
        d={pathData.path}
        fill="none"
        stroke={style.stroke}
        strokeWidth={style.strokeWidth}
        opacity={style.opacity}
        strokeLinecap="round"
        markerEnd={`url(#${getArrowMarkerId()})`}
        className={`connection-path ${connection.isAnimated ? 'animated' : ''} ${connection.isHighlighted ? 'highlighted' : ''}`}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
      />

      {/* 连接线上的标签（如果有强度指示） */}
      {connection.strength && connection.strength > 0.8 && (
        <g className="connection-label">
          <circle
            cx={(pathData.from.x + pathData.to.x) / 2}
            cy={(pathData.from.y + pathData.to.y) / 2}
            r="8"
            fill="white"
            stroke={style.stroke}
            strokeWidth="1"
            opacity="0.9"
          />
          <text
            x={(pathData.from.x + pathData.to.x) / 2}
            y={(pathData.from.y + pathData.to.y) / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fill={style.stroke}
            fontWeight="600"
          >
            {Math.round(connection.strength * 100)}
          </text>
        </g>
      )}

      {/* 悬停状态的额外视觉效果 */}
      {connection.isHighlighted && (
        <path
          d={pathData.path}
          fill="none"
          stroke={style.stroke}
          strokeWidth={style.strokeWidth + 4}
          opacity="0.1"
          strokeLinecap="round"
          className="connection-glow"
          style={{
            filter: 'blur(2px)'
          }}
        />
      )}

      {/* 动画效果 */}
      {connection.isAnimated && (
        <circle
          r="3"
          fill={style.stroke}
          opacity="0.8"
          className="connection-pulse"
        >
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={pathData.path}
          />
        </circle>
      )}

      <style jsx>{`
        :global(.connection-path) {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        :global(.connection-path:hover) {
          stroke-width: ${style.strokeWidth + 1}px !important;
          opacity: ${Math.min(1, style.opacity + 0.2)} !important;
        }

        :global(.connection-path.animated) {
          stroke-dasharray: 8 4;
          animation: dash-flow 2s linear infinite;
        }

        :global(.connection-path.highlighted) {
          filter: drop-shadow(0 0 4px currentColor);
        }

        :global(.connection-label) {
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        :global(.connection-line-group:hover .connection-label) {
          opacity: 1;
        }

        :global(.connection-pulse) {
          filter: drop-shadow(0 0 3px currentColor);
        }

        @keyframes dash-flow {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -12;
          }
        }

        @keyframes connection-draw {
          0% {
            stroke-dasharray: ${pathData.distance} ${pathData.distance};
            stroke-dashoffset: ${pathData.distance};
          }
          100% {
            stroke-dasharray: ${pathData.distance} ${pathData.distance};
            stroke-dashoffset: 0;
          }
        }

        :global(.connection-path.draw-in) {
          animation: connection-draw 0.8s ease-out;
        }
      `}</style>
    </g>
  )
}

/**
 * 计算从一个矩形到另一个点的边缘连接点
 */
function getEdgePoint(
  center: Position,
  targetCenter: Position,
  size: { width: number; height: number }
): Position {
  const dx = targetCenter.x - center.x
  const dy = targetCenter.y - center.y
  
  const halfWidth = size.width / 2
  const halfHeight = size.height / 2
  
  // 计算与矩形边界的交点
  const absRatio = Math.abs(dy / dx)
  const sizeRatio = halfHeight / halfWidth
  
  if (absRatio <= sizeRatio) {
    // 连接到左右边
    const x = dx > 0 ? halfWidth : -halfWidth
    const y = (dy / dx) * x
    return { x: x + halfWidth, y: y + halfHeight }
  } else {
    // 连接到上下边
    const y = dy > 0 ? halfHeight : -halfHeight
    const x = (dx / dy) * y
    return { x: x + halfWidth, y: y + halfHeight }
  }
}

/**
 * 连接线容器组件
 * 用于管理所有连接线
 */
interface ConnectionLayerProps {
  connections: ConnectionData[]
  outputConnections?: any[] // 输出节点连接
  canvasOffset?: Position
  onConnectionClick?: (connectionId: string) => void
  onConnectionHover?: (connectionId: string | null) => void
}

interface ExtendedConnectionLayerProps extends ConnectionLayerProps {
  cards?: any[] // 画布卡片信息
  outputNodes?: any[] // 输出节点信息
}

export function ConnectionLayer({
  connections,
  outputConnections = [],
  canvasOffset = { x: 0, y: 0 },
  onConnectionClick,
  onConnectionHover,
  ...props
}: ExtendedConnectionLayerProps) {
  // 转换outputConnections为ConnectionData格式
  const convertedOutputConnections: ConnectionData[] = []
  
  if (outputConnections.length > 0 && props.cards && props.outputNodes) {
    console.log('🔗 [ConnectionLayer] 开始转换输出连接:', {
      outputConnections: outputConnections.length,
      cards: props.cards.length,
      outputNodes: props.outputNodes.length
    })
    
    outputConnections.forEach(conn => {
      try {
        // 查找源节点和目标节点
        const fromNode = props.outputNodes!.find(node => node.id === conn.fromId)
        const toCard = props.cards!.find(card => card.noteId === conn.toId)
        
        if (fromNode && toCard) {
          const connectionData: ConnectionData = {
            id: conn.id,
            fromId: conn.fromId,
            toId: conn.toId,
            fromType: 'question', // 输出节点视为question类型
            toType: 'note',
            fromPosition: fromNode.position,
            toPosition: toCard.position,
            fromSize: { width: 400, height: 200 }, // 输出节点默认尺寸
            toSize: { width: 280, height: 200 }, // 卡片默认尺寸
            relationshipType: conn.status === 'active' ? 'referenced' : 'related',
            strength: conn.strength || 0.8,
            isHighlighted: conn.status === 'active',
            isAnimated: conn.status === 'new'
          }
          convertedOutputConnections.push(connectionData)
          console.log('✅ [ConnectionLayer] 成功转换连接:', {
            from: conn.fromId,
            to: conn.toId,
            status: conn.status
          })
        } else {
          console.warn('⚠️ [ConnectionLayer] 找不到连接的节点:', {
            fromId: conn.fromId,
            toId: conn.toId,
            foundFromNode: !!fromNode,
            foundToCard: !!toCard
          })
        }
      } catch (error) {
        console.error('❌ [ConnectionLayer] 转换连接时出错:', error)
      }
    })
  }
  
  // 合并所有连接线
  const allConnections = [...connections, ...convertedOutputConnections]
  
  if (allConnections.length === 0) {
    console.log('🔗 [ConnectionLayer] 无连接线需要渲染')
    return null
  }
  
  console.log('🔗 [ConnectionLayer] 渲染连接线:', {
    originalConnections: connections.length,
    convertedOutputConnections: convertedOutputConnections.length,
    totalConnections: allConnections.length
  })

  return (
    <svg
      className="connection-layer"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1
      }}
    >
      <g style={{ pointerEvents: 'auto' }}>
        {allConnections.map(connection => (
          <ConnectionLine
            key={connection.id}
            connection={connection}
            canvasOffset={canvasOffset}
            onConnectionClick={onConnectionClick}
            onConnectionHover={onConnectionHover}
          />
        ))}
      </g>
    </svg>
  )
}