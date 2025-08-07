'use client'

import React, { useState, useRef } from 'react'
import { Position } from '@/types/canvas'

interface ConnectionPointProps {
  // 连接点的位置：top, right, bottom, left
  position: 'top' | 'right' | 'bottom' | 'left'
  // 是否已连接
  isConnected?: boolean
  // 连接点是否激活（用于拖拽状态）
  isActive?: boolean
  // 连接点是否可见
  isVisible?: boolean
  // 开始拖拽连接的回调
  onDragStart?: (e: React.DragEvent, position: Position) => void
  // 拖拽结束的回调
  onDragEnd?: (e: React.DragEvent) => void
  // 点击连接点的回调（用于显示连接管理）
  onClick?: (e: React.MouseEvent) => void
  // 父元素的引用（用于计算相对位置）
  parentRef?: React.RefObject<HTMLElement | null>
}

export function ConnectionPoint({
  position,
  isConnected = false,
  isActive = false,
  isVisible = true,
  onDragStart,
  onDragEnd,
  onClick,
  parentRef
}: ConnectionPointProps) {
  const [isDragging, setIsDragging] = useState(false)
  const connectionPointRef = useRef<HTMLDivElement>(null)

  // 获取连接点的绝对位置
  const getConnectionPointPosition = (): Position => {
    if (!connectionPointRef.current || !parentRef?.current) {
      return { x: 0, y: 0 }
    }

    const pointRect = connectionPointRef.current.getBoundingClientRect()
    const parentRect = parentRef.current.getBoundingClientRect()
    
    return {
      x: pointRect.left - parentRect.left + pointRect.width / 2,
      y: pointRect.top - parentRect.top + pointRect.height / 2
    }
  }

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'copy'
    
    // 设置拖拽数据
    e.dataTransfer.setData('application/x-connection-drag', JSON.stringify({
      type: 'connection-point',
      position: getConnectionPointPosition()
    }))
    
    onDragStart?.(e, getConnectionPointPosition())
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false)
    onDragEnd?.(e)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClick?.(e)
  }

  // 根据位置计算连接点的样式
  const getPositionStyles = () => {
    const base = 'absolute w-3 h-3 rounded-full'
    
    switch (position) {
      case 'top':
        return `${base} -top-1.5 left-1/2 -translate-x-1/2`
      case 'right':
        return `${base} -right-1.5 top-1/2 -translate-y-1/2`
      case 'bottom':
        return `${base} -bottom-1.5 left-1/2 -translate-x-1/2`
      case 'left':
        return `${base} -left-1.5 top-1/2 -translate-y-1/2`
      default:
        return base
    }
  }

  // 连接点的状态样式
  const getStateStyles = () => {
    if (isDragging) {
      return 'bg-blue-500 border-2 border-blue-300 scale-125'
    }
    
    if (isActive) {
      return 'bg-blue-400 border-2 border-blue-200 scale-110'
    }
    
    if (isConnected) {
      return 'bg-blue-500 border-2 border-blue-300'
    }
    
    return 'bg-gray-400 border-2 border-gray-200 hover:bg-blue-400 hover:border-blue-200'
  }

  if (!isVisible) {
    return null
  }

  return (
    <div
      ref={connectionPointRef}
      className={`
        ${getPositionStyles()}
        ${getStateStyles()}
        cursor-pointer
        transition-all duration-200
        z-10
        shadow-sm
        hover:shadow-md
        ${isDragging ? 'ring-2 ring-blue-300 ring-opacity-50' : ''}
      `}
      draggable={true}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={handleClick}
      title={`连接点 (${position})`}
    >
      {/* 连接点内部指示器 */}
      <div className="absolute inset-0.5 rounded-full bg-white opacity-50" />
      
      {/* 连接状态指示器 */}
      {isConnected && (
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white" />
      )}
    </div>
  )
}