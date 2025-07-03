'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface GravityRopeDragHandleProps {
  onDragStart: () => void
  onDragEnd: () => void
  onDragProgress: (progress: number) => void
  isDragging: boolean
  className?: string
}

export default function GravityRopeDragHandle({
  onDragStart,
  onDragEnd,
  onDragProgress,
  isDragging,
  className = ''
}: GravityRopeDragHandleProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [dragDistance, setDragDistance] = useState(0)
  const [ropeSwing, setRopeSwing] = useState(0)
  const [quillRotation, setQuillRotation] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const swingTimeRef = useRef(0)
  const lastMousePos = useRef({ x: 0, y: 0 })

  // 自然摆动动画
  useEffect(() => {
    if (isDragging) return

    const animate = () => {
      swingTimeRef.current += 0.02
      const naturalSwing = Math.sin(swingTimeRef.current) * 8 * Math.exp(-swingTimeRef.current * 0.1)
      const randomPerturbation = Math.sin(swingTimeRef.current * 0.3) * 2
      
      setRopeSwing(naturalSwing + randomPerturbation)
      setQuillRotation(naturalSwing * 0.3)
      
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isDragging])

  // 鼠标跟踪效果
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    const deltaX = e.clientX - centerX
    const deltaY = e.clientY - centerY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    
    if (distance < 100 && !isDragging) {
      // 磁性吸引效果
      const attraction = Math.max(0, (100 - distance) / 100)
      const attractionAngle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)
      setRopeSwing(attractionAngle * 0.3 * attraction)
      setQuillRotation(attractionAngle * 0.1 * attraction)
    }

    lastMousePos.current = { x: e.clientX, y: e.clientY }
  }, [isDragging])

  useEffect(() => {
    if (isHovered || isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      return () => document.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isHovered, isDragging, handleMouseMove])

  // 拖拽处理
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    onDragStart()
    
    const startX = e.clientX
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentX = moveEvent.clientX
      const distance = Math.max(0, startX - currentX) // 向左拖拽
      setDragDistance(distance)
      
      // 计算进度 (0-120px)
      const progress = Math.min(distance / 120, 1)
      onDragProgress(progress)
      
      // 拖拽时绳子拉直
      if (distance > 20) {
        setRopeSwing(0)
        setQuillRotation(-distance * 0.5)
      }
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      
      setDragDistance(0)
      setRopeSwing(0)
      setQuillRotation(0)
      onDragEnd()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 计算绳子路径
  const getRopePath = () => {
    const anchorX = 8
    const anchorY = 20
    const quillX = anchorX + ropeSwing * 0.5 - dragDistance * 0.3
    const quillY = anchorY + 100 + Math.abs(ropeSwing) * 0.2
    
    // 贝塞尔曲线模拟绳子弯曲
    const controlX = (anchorX + quillX) / 2 + ropeSwing * 0.3
    const controlY = (anchorY + quillY) / 2 + 20
    
    return `M ${anchorX},${anchorY} Q ${controlX},${controlY} ${quillX},${quillY}`
  }

  return (
    <div
      ref={containerRef}
      className={`fixed right-0 top-1/2 -translate-y-1/2 w-16 h-32 pointer-events-auto z-[65] ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
      style={{ transform: 'translateY(-50%) translateX(50%)' }}
    >
      {/* 绳子 SVG */}
      <svg
        className="absolute inset-0 w-full h-full overflow-visible"
        viewBox="0 0 64 128"
        fill="none"
      >
        {/* 固定点 (铆钉) */}
        <circle
          cx="8"
          cy="20"
          r="4"
          fill="url(#rivetGradient)"
          className="drop-shadow-sm"
        />
        
        {/* 绳子 */}
        <path
          d={getRopePath()}
          stroke="url(#ropeGradient)"
          strokeWidth="2"
          fill="none"
          className="drop-shadow-sm"
          style={{
            filter: isDragging ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : 'none'
          }}
        />

        {/* 渐变定义 */}
        <defs>
          <linearGradient id="rivetGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9CA3AF" />
            <stop offset="50%" stopColor="#6B7280" />
            <stop offset="100%" stopColor="#4B5563" />
          </linearGradient>
          
          <linearGradient id="ropeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9CA3AF" />
            <stop offset="100%" stopColor="#6B7280" />
          </linearGradient>
          
          <linearGradient id="quillGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="50%" stopColor="#6366F1" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>

      {/* 羽毛笔吊坠 */}
      <div
        className={`absolute transition-all duration-300 ${
          isHovered || isDragging ? 'scale-110' : 'scale-100'
        }`}
        style={{
          left: `${8 + ropeSwing * 0.5 - dragDistance * 0.3}px`,
          top: `${120 + Math.abs(ropeSwing) * 0.2}px`,
          transform: `translate(-50%, -50%) rotate(${quillRotation}deg)`,
          filter: isDragging ? 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' : 
                  isHovered ? 'drop-shadow(0 4px 12px rgba(59, 130, 246, 0.3))' : 
                  'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.2))'
        }}
      >
        {/* 羽毛笔图标 */}
        <svg
          width="16"
          height="36"
          viewBox="0 0 16 36"
          fill="none"
          className="drop-shadow-sm"
        >
          {/* 笔尖 */}
          <path
            d="M8 32 L6 28 L10 28 Z"
            fill="#374151"
          />
          
          {/* 笔杆 */}
          <rect
            x="7"
            y="20"
            width="2"
            height="8"
            fill="#4B5563"
          />
          
          {/* 羽毛主体 */}
          <path
            d="M8 4 C12 6, 14 12, 12 18 C10 16, 6 16, 4 18 C2 12, 4 6, 8 4 Z"
            fill="url(#quillGradient)"
            className={isHovered || isDragging ? 'animate-pulse' : ''}
          />
          
          {/* 羽毛纹理 */}
          <path
            d="M8 6 C10 8, 11 12, 10 16"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="0.5"
            fill="none"
          />
          <path
            d="M8 8 C6 10, 5 12, 6 16"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="0.5"
            fill="none"
          />
        </svg>
      </div>

      {/* 悬停提示 */}
      {isHovered && !isDragging && (
        <div
          className="absolute right-full mr-4 top-1/2 -translate-y-1/2 
                     bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 
                     px-3 py-2 rounded-lg text-sm whitespace-nowrap
                     opacity-0 animate-fadeIn"
          style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
        >
          拖拽生成结构化笔记
          <div className="absolute left-full top-1/2 -translate-y-1/2 
                          border-l-4 border-l-gray-900 dark:border-l-gray-100 
                          border-y-4 border-y-transparent"></div>
        </div>
      )}

      {/* 拖拽进度提示 */}
      {isDragging && (
        <div
          className="absolute right-full mr-4 top-1/2 -translate-y-1/2 
                     bg-blue-600 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap
                     animate-pulse"
        >
          {dragDistance < 40 ? '继续拖拽...' : 
           dragDistance < 80 ? '快到了！' : 
           '松开生成笔记！'}
          <div className="absolute left-full top-1/2 -translate-y-1/2 
                          border-l-4 border-l-blue-600 
                          border-y-4 border-y-transparent"></div>
        </div>
      )}
    </div>
  )
}