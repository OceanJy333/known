'use client'

import React from 'react'
import { Position } from '@/types/canvas'

interface ConnectionPreviewProps {
  startPoint: Position
  endPoint: Position
  isVisible: boolean
}

export function ConnectionPreview({ startPoint, endPoint, isVisible }: ConnectionPreviewProps) {
  if (!isVisible) return null

  // 创建平滑的贝塞尔曲线路径
  const createPath = (start: Position, end: Position) => {
    const dx = end.x - start.x
    const dy = end.y - start.y
    
    // 控制点距离，用于创建平滑曲线
    const controlPointDistance = Math.min(Math.abs(dx), Math.abs(dy)) * 0.5 + 50
    
    // 根据方向调整控制点
    const cp1x = start.x + (dx > 0 ? controlPointDistance : -controlPointDistance)
    const cp1y = start.y
    const cp2x = end.x - (dx > 0 ? controlPointDistance : -controlPointDistance)
    const cp2y = end.y
    
    return `M ${start.x},${start.y} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${end.x},${end.y}`
  }

  // 计算SVG的边界框
  const padding = 50
  const minX = Math.min(startPoint.x, endPoint.x) - padding
  const minY = Math.min(startPoint.y, endPoint.y) - padding
  const maxX = Math.max(startPoint.x, endPoint.x) + padding
  const maxY = Math.max(startPoint.y, endPoint.y) + padding
  
  const width = maxX - minX
  const height = maxY - minY

  // 调整坐标到SVG坐标系
  const adjustedStart = { x: startPoint.x - minX, y: startPoint.y - minY }
  const adjustedEnd = { x: endPoint.x - minX, y: endPoint.y - minY }

  const path = createPath(adjustedStart, adjustedEnd)

  return (
    <svg
      className="absolute pointer-events-none z-20"
      style={{
        left: minX,
        top: minY,
        width,
        height
      }}
    >
      {/* 阴影效果 */}
      <defs>
        <filter id="connection-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.2)" />
        </filter>
        
        {/* 动画定义 */}
        <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3">
            <animate attributeName="stopOpacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8">
            <animate attributeName="stopOpacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
          </stop>
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3">
            <animate attributeName="stopOpacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
          </stop>
        </linearGradient>
      </defs>
      
      {/* 预览连接线 */}
      <path
        d={path}
        fill="none"
        stroke="url(#connection-gradient)"
        strokeWidth="3"
        strokeDasharray="8,4"
        filter="url(#connection-shadow)"
        opacity="0.8"
      />
      
      {/* 起点标记 */}
      <circle
        cx={adjustedStart.x}
        cy={adjustedStart.y}
        r="4"
        fill="#3b82f6"
        stroke="white"
        strokeWidth="2"
        opacity="0.9"
      />
      
      {/* 终点标记（箭头） */}
      <defs>
        <marker
          id="preview-arrow"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" opacity="0.8" />
        </marker>
      </defs>
      
      {/* 带箭头的预览线 */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth="3"
        markerEnd="url(#preview-arrow)"
      />
      
      {/* 连接提示文本 */}
      <text
        x={adjustedStart.x + (adjustedEnd.x - adjustedStart.x) / 2}
        y={adjustedStart.y + (adjustedEnd.y - adjustedStart.y) / 2 - 10}
        textAnchor="middle"
        className="text-xs font-medium"
        fill="#3b82f6"
        opacity="0.8"
      >
        释放以创建连接
      </text>
    </svg>
  )
}