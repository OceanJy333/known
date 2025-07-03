'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { DiffAction } from './DiffCard'

interface DiffMiniMapProps {
  diffs: DiffAction[]
  contentElement: HTMLElement | null
  currentDiffId?: string
  onScrollToPosition: (position: number) => void
  onDiffClick?: (diffId: string) => void
}

interface DiffMarker {
  id: string
  type: 'insert' | 'delete' | 'replace' | 'search_replace'
  status: 'pending' | 'accepted' | 'rejected' | 'failed' | 'retrying'
  position: number // 0-1 的相对位置
  label: string
}

export default function DiffMiniMap({
  diffs,
  contentElement,
  currentDiffId,
  onScrollToPosition,
  onDiffClick
}: DiffMiniMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const [hoveredDiff, setHoveredDiff] = useState<string | null>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  
  // 监听内容元素滚动
  useEffect(() => {
    if (!contentElement) return
    
    const handleScroll = () => {
      setScrollTop(contentElement.scrollTop)
    }
    
    contentElement.addEventListener('scroll', handleScroll, { passive: true })
    return () => contentElement.removeEventListener('scroll', handleScroll)
  }, [contentElement])
  
  // 检查是否需要显示 MiniMap
  useEffect(() => {
    const shouldShow = diffs.length > 0 && !!contentElement
    setIsVisible(shouldShow)
  }, [diffs.length, contentElement])
  
  // 计算 diff 在文档中的相对位置
  const markers: DiffMarker[] = diffs.map((diff, index) => {
    // 基于 diff 在列表中的相对位置，实际应该计算在文档中的真实位置
    const position = (index + 1) / (diffs.length + 1)
    
    return {
      id: diff.id,
      type: diff.type as 'insert' | 'delete' | 'replace',
      status: diff.status,
      position,
      label: `${diff.type === 'insert' ? '+' : diff.type === 'delete' ? '-' : '±'} ${diff.id.slice(-4)}`
    }
  })
  
  // 获取类型对应的颜色 - 更柔和精致的颜色
  const getColor = (type: DiffAction['type'], status: DiffAction['status'], isHovered: boolean, isCurrent: boolean) => {
    if (isCurrent) {
      return '#60A5FA' // 更柔和的蓝色
    }
    
    const alpha = isHovered ? '0.9' : status === 'pending' ? '0.6' : '0.3'
    
    switch (type) {
      case 'insert':
        return `rgba(52, 168, 83, ${alpha})` // 更柔和的绿色
      case 'delete':
        return `rgba(220, 53, 69, ${alpha})` // 更柔和的红色
      case 'replace':
        return `rgba(147, 51, 234, ${alpha})` // 更柔和的紫色
      default:
        return `rgba(148, 163, 184, ${alpha})` // 更柔和的灰色
    }
  }
  
  // 绘制 minimap
  const drawMiniMap = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !contentElement) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const canvasHeight = canvas.height
    const canvasWidth = canvas.width
    
    // 清空画布并启用抗锯齿
    ctx.clearRect(0, 0, canvasWidth, canvasHeight)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    // 绘制精致背景 - 几乎透明
    ctx.fillStyle = 'rgba(0, 0, 0, 0.01)'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)
    
    // 绘制视口指示器
    const contentHeight = contentElement.scrollHeight
    const viewportHeight = contentElement.clientHeight
    const viewportRatio = viewportHeight / contentHeight
    const viewportTop = (scrollTop / contentHeight) * canvasHeight
    const viewportHeightOnMap = viewportRatio * canvasHeight
    
    // 精致的视口背景
    ctx.fillStyle = 'rgba(96, 165, 250, 0.05)'
    ctx.fillRect(1, viewportTop, canvasWidth - 2, viewportHeightOnMap)
    
    // 精致的视口边框
    ctx.strokeStyle = 'rgba(96, 165, 250, 0.2)'
    ctx.lineWidth = 0.5
    ctx.strokeRect(1, viewportTop, canvasWidth - 2, viewportHeightOnMap)
    
    // 绘制 diff 标记
    markers.forEach(marker => {
      const y = marker.position * canvasHeight
      const isHovered = hoveredDiff === marker.id
      const isCurrent = currentDiffId === marker.id
      const color = getColor(marker.type, marker.status, isHovered, isCurrent)
      
      // 绘制精致标记线
      ctx.strokeStyle = color
      ctx.lineWidth = isCurrent ? 1.5 : isHovered ? 1 : 0.5
      ctx.beginPath()
      ctx.moveTo(3, y)
      ctx.lineTo(canvasWidth - 4, y)
      ctx.stroke()
      
      // 绘制精致标记点
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(canvasWidth - 2, y, isCurrent ? 2.5 : isHovered ? 2 : 1.5, 0, Math.PI * 2)
      ctx.fill()
      
      // 精致的光晕效果
      if (isCurrent) {
        const gradient = ctx.createRadialGradient(canvasWidth - 2, y, 0, canvasWidth - 2, y, 6)
        gradient.addColorStop(0, color.replace(/rgba?\([^,]+,[^,]+,[^,]+,[^)]+\)/, color.replace(/[^,]+\)$/, '0.4)')))
        gradient.addColorStop(1, 'transparent')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(canvasWidth - 2, y, 6, 0, Math.PI * 2)
        ctx.fill()
      }
    })
  }, [markers, scrollTop, contentElement, hoveredDiff, currentDiffId])
  
  // 重绘
  useEffect(() => {
    if (isVisible) {
      drawMiniMap()
    }
  }, [drawMiniMap, isVisible])
  
  // 处理点击
  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !contentElement) return
    
    const rect = canvas.getBoundingClientRect()
    const y = e.clientY - rect.top
    const relativeY = y / canvas.height
    
    // 查找最近的 diff
    let closestDiff: DiffMarker | null = null
    let minDistance = Infinity
    
    markers.forEach((marker: DiffMarker) => {
      const distance = Math.abs(marker.position - relativeY)
      if (distance < minDistance && distance < 0.05) { // 5% 的容差
        minDistance = distance
        closestDiff = marker
      }
    })
    
    if (closestDiff) {
      onDiffClick?.((closestDiff as DiffMarker).id)
    } else {
      // 滚动到点击位置
      const targetScrollTop = relativeY * contentElement.scrollHeight
      onScrollToPosition(targetScrollTop)
    }
  }
  
  // 处理鼠标移动
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    const y = e.clientY - rect.top
    const relativeY = y / canvas.height
    
    // 查找悬停的 diff
    let hoveredMarker: DiffMarker | null = null
    
    markers.forEach(marker => {
      const distance = Math.abs(marker.position - relativeY)
      if (distance < 0.03) { // 3% 的容差
        hoveredMarker = marker
      }
    })
    
    setHoveredDiff((hoveredMarker as DiffMarker | null)?.id || null)
    canvas.style.cursor = hoveredMarker ? 'pointer' : 'default'
  }
  
  const handleMouseLeave = () => {
    setHoveredDiff(null)
  }
  
  if (!isVisible) return null
  
  return (
    <div 
      ref={mapRef}
      className="diff-minimap-overlay absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none"
    >
      {/* 主要的 MiniMap 容器 */}
      <div className="relative h-full w-full pointer-events-auto">
        {/* 精致的毛玻璃背景 */}
        <div className="absolute inset-0 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md border-l border-white/20 dark:border-gray-700/20 shadow-sm"></div>
        
        {/* 画布 */}
        <canvas
          ref={canvasRef}
          width={24}
          height={400}
          className="absolute inset-0 w-full h-full cursor-pointer transition-opacity hover:opacity-90"
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ imageRendering: 'auto' }}
        />
        
        {/* 悬停提示 */}
        {hoveredDiff && (
          <div className="absolute right-6 pointer-events-none z-20">
            {markers.filter(m => m.id === hoveredDiff).map(marker => (
              <div
                key={marker.id}
                className="absolute right-0 w-16 bg-black/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md shadow-xl border border-white/10"
                style={{ 
                  top: `${marker.position * 100}%`,
                  transform: 'translateY(-50%)'
                }}
              >
                <div className="font-medium text-center">{marker.label}</div>
              </div>
            ))}
          </div>
        )}
        
        {/* 精致底部统计 */}
        <div className="absolute bottom-1 left-0 right-0 text-center pointer-events-none">
          <div className="text-xs text-gray-400 dark:text-gray-500 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-full px-1.5 py-0.5 mx-auto inline-block">
            {diffs.length}
          </div>
        </div>
      </div>
    </div>
  )
}