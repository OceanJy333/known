'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

interface TableOfContent {
  id: string
  title: string
  level: number
  summary?: string
  anchor?: string
  location?: {
    textAnchor?: string
    charPosition?: number
  }
}

interface FloatingTOCProps {
  toc: TableOfContent[]
  isVisible: boolean
  onToggle: () => void
  isAnalyzing?: boolean
  // 文档概览信息
  wordCount?: number
  readingTime?: number
  documentSummary?: string
}

export default function FloatingTOC({ 
  toc, 
  isVisible, 
  onToggle, 
  isAnalyzing = false,
  wordCount,
  readingTime,
  documentSummary
}: FloatingTOCProps) {
  const [activeId, setActiveId] = useState<string>('')
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  const [cardHeight, setCardHeight] = useState('80vh')
  const [verticalMargin, setVerticalMargin] = useState('8vh')
  const tocRef = useRef<HTMLDivElement>(null)
  const scrollTimeout = useRef<NodeJS.Timeout | null>(null)

  // 计算动态高度和边距 - 为固定标签栏留出空间
  useEffect(() => {
    const updateDimensions = () => {
      const vh = window.innerHeight
      const tabBarHeight = 64 // 标签栏高度
      const topMargin = tabBarHeight + 24 // 标签栏 + 24px间距
      const bottomMargin = vh * 0.08 // 底部8%边距
      const availableHeight = vh - topMargin - bottomMargin
      setCardHeight(`${availableHeight}px`)
      setVerticalMargin(`${topMargin}px`)
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions, { passive: true })
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // 简化的滚动监听逻辑
  const handleScroll = useCallback(() => {
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current)
    }
    
    scrollTimeout.current = setTimeout(() => {
      const scrollContainer = document.querySelector('.ios-scrollbar')
      if (!scrollContainer) return
      
      const headings = toc.map(item => document.getElementById(item.id)).filter(Boolean)
      if (headings.length === 0) return
      
      // 获取滚动容器的信息
      const containerRect = scrollContainer.getBoundingClientRect()
      const scrollTop = scrollContainer.scrollTop
      
      // 找到最合适的章节：最后一个在视口顶部之上或之内的章节
      let newActiveId = headings[0]?.id || ''
      
      for (const heading of headings) {
        if (heading) {
          const headingRect = heading.getBoundingClientRect()
          const headingOffsetFromContainerTop = headingRect.top - containerRect.top + scrollTop
          
          if (headingOffsetFromContainerTop <= scrollTop + 150) {
            newActiveId = heading.id
          } else {
            break
          }
        }
      }
      
      // 更新活动章节
      if (newActiveId && newActiveId !== activeId) {
        setActiveId(newActiveId)
      }
    }, 50)
  }, [toc, activeId])

  useEffect(() => {
    if (toc.length === 0) return
    
    const scrollContainer = document.querySelector('.ios-scrollbar')
    if (!scrollContainer) return

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // 初始化

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll)
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current)
      }
    }
  }, [toc, handleScroll])

  const scrollToHeading = useCallback((id: string) => {
    // 立即设置选中状态
    setActiveId(id)
    
    const element = document.getElementById(id)
    
    if (!element) {
      console.warn(`未找到章节: ${id}`)
      // 如果元素不存在，尝试在短暂延迟后再试一次
      setTimeout(() => {
        const retryElement = document.getElementById(id)
        if (retryElement) {
          scrollToElement(retryElement)
        }
      }, 100)
      return
    }
    
    scrollToElement(element)
  }, [])
  
  const scrollToElement = (element: HTMLElement) => {
    // 找到滚动容器（带有 ios-scrollbar 类的容器）
    const scrollContainer = document.querySelector('.ios-scrollbar')
    
    if (!scrollContainer) {
      console.warn('未找到滚动容器')
      return
    }
    
    // 计算元素相对于滚动容器的位置
    const containerRect = scrollContainer.getBoundingClientRect()
    const elementRect = element.getBoundingClientRect()
    
    // 计算需要滚动的距离
    const scrollTop = scrollContainer.scrollTop + elementRect.top - containerRect.top - 100
    
    // 在容器内滚动
    scrollContainer.scrollTo({
      top: scrollTop,
      behavior: 'smooth'
    })
  }

  const handleCollapse = useCallback(() => {
    setIsCollapsed(true)
    setTimeout(() => onToggle(), 300)
  }, [onToggle])

  const handleExpand = useCallback(() => {
    setIsCollapsed(false)
    onToggle()
  }, [onToggle])

  // 记忆化计算导航高度
  const navHeight = useMemo(() => {
    return `calc(${cardHeight} - 80px)` // 减去头部和底部的高度
  }, [cardHeight])

  if (toc.length === 0 && !isAnalyzing) return null

  // 如果目录不可见，显示展开按钮
  if (!isVisible) {
    return (
      <button
        onClick={handleExpand}
        className="toc-toggle-btn fixed z-[60] p-4 bg-white/8 dark:bg-black/8 backdrop-blur-lg rounded-full shadow-lg border border-white/10 dark:border-white/5 group"
        style={{ 
          top: verticalMargin, 
          left: '24px' 
        }}
        title="打开目录"
      >
        <i className="fas fa-list text-gray-700 dark:text-gray-300 text-base group-hover:scale-110 transition-transform duration-200"></i>
      </button>
    )
  }

  return (
    <div 
      ref={tocRef}
      className={`fixed left-6 z-[55] w-80 transition-all duration-500 ease-out ${
        isCollapsed ? 'opacity-0 -translate-x-full scale-90 pointer-events-none' : 'opacity-100 translate-x-0 scale-100'
      }`}
      style={{ 
        top: verticalMargin,
        height: cardHeight 
      }}
    >
      <div className="toc-card overflow-hidden h-full flex flex-col">
        {/* 文档概览头部 */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="relative mr-3">
                <div className="w-2 h-2 bg-blue-500/60 dark:bg-blue-400/60 rounded-full"></div>
                {isAnalyzing && (
                  <>
                    {/* 呼吸效果圆环 */}
                    <div className="absolute inset-0 w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-breathe"></div>
                    <div className="absolute -inset-1 w-4 h-4 bg-blue-500/20 dark:bg-blue-400/20 rounded-full animate-breathe-slow"></div>
                  </>
                )}
              </div>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                文档概览
              </span>
            </div>
            
            {/* 收缩按钮 */}
            <button
              onClick={handleCollapse}
              className="p-2 hover:bg-white/10 dark:hover:bg-black/10 rounded-full transition-all duration-200 group"
              title="收起目录"
            >
              <i className="fas fa-chevron-left text-gray-500 dark:text-gray-400 text-xs group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors"></i>
            </button>
          </div>

          {/* 文档统计信息 */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-white/5 dark:bg-black/5 rounded-lg backdrop-blur-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400">字数</div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {wordCount ? `${(wordCount / 1000).toFixed(1)}k` : '-'}
              </div>
            </div>
            <div className="text-center p-2 bg-white/5 dark:bg-black/5 rounded-lg backdrop-blur-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400">章节</div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {isAnalyzing && toc.length === 0 ? '分析中' : toc.length}
              </div>
            </div>
            <div className="text-center p-2 bg-white/5 dark:bg-black/5 rounded-lg backdrop-blur-sm">
              <div className="text-xs text-gray-500 dark:text-gray-400">阅读</div>
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {readingTime ? `${readingTime}分钟` : '-'}
              </div>
            </div>
          </div>

          {/* AI导读 */}
          {documentSummary && (
            <div className="p-3 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-900/10 dark:to-indigo-900/10 rounded-xl border border-blue-100/30 dark:border-blue-800/30 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <i className="fas fa-robot text-blue-500 dark:text-blue-400 text-xs"></i>
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">AI 导读</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {documentSummary}
              </p>
            </div>
          )}
        </div>

        {/* 章节分隔线 */}
        <div className="px-6 pb-2">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200/50 dark:via-gray-700/50 to-transparent"></div>
          <div className="flex items-center gap-2 mt-3">
            <i className="fas fa-list text-gray-500 dark:text-gray-400 text-xs"></i>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">章节导航</span>
          </div>
        </div>

        {/* 目录内容 */}
        <nav 
          className="toc-scroll-container flex-1 overflow-y-auto custom-scrollbar px-4 pb-4"
        >
          {toc.length === 0 && isAnalyzing ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-3"></div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">AI 正在智能分析</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">为您生成章节目录...</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {toc.map((item, index) => (
              <li key={item.id} 
                  className="animate-fadeInUp" 
                  style={{ 
                    animationDelay: `${index * 0.1}s`,
                    animationFillMode: 'both'
                  }}>
                <button
                  onClick={() => scrollToHeading(item.id)}
                  className={`toc-item-btn w-full text-left py-2.5 px-3 rounded-lg text-xs transition-all duration-200 group ${
                    activeId === item.id
                      ? 'bg-blue-500/15 dark:bg-blue-400/15 text-blue-700 dark:text-blue-300 font-medium'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-white/8 dark:hover:bg-black/8 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                  style={{ 
                    paddingLeft: `${item.level * 16 + 16}px` 
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* 简化的层级指示器 */}
                    <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 transition-all duration-200 ${
                      activeId === item.id 
                        ? 'bg-blue-500 dark:bg-blue-400 scale-150' 
                        : 'bg-gray-400 dark:bg-gray-500 group-hover:bg-gray-500 dark:group-hover:bg-gray-400'
                    }`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.title}</div>
                      {item.summary && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed" 
                             style={{
                               display: '-webkit-box',
                               WebkitLineClamp: 2,
                               WebkitBoxOrient: 'vertical',
                               overflow: 'hidden'
                             }}>
                          {item.summary}
                        </div>
                      )}
                    </div>
                    
                    {/* 当前章节指示器 */}
                    {activeId === item.id && (
                      <div className="w-1.5 h-1.5 bg-blue-500 dark:bg-blue-400 rounded-full mt-2 animate-pulse flex-shrink-0" />
                    )}
                  </div>
                </button>
              </li>
              ))}
            </ul>
          )}
          
          {/* 分析进行中时在底部显示呼吸效果 */}
          {isAnalyzing && toc.length > 0 && (
            <div className="mt-4 flex justify-center py-2">
              <div className="relative">
                {/* 中心圆点 */}
                <div className="w-2 h-2 bg-blue-500/60 dark:bg-blue-400/60 rounded-full"></div>
                {/* 呼吸环 1 */}
                <div className="absolute inset-0 w-2 h-2 bg-blue-500 dark:bg-blue-400 rounded-full animate-breathe"></div>
                {/* 呼吸环 2 */}
                <div className="absolute -inset-1.5 w-5 h-5 bg-blue-500/20 dark:bg-blue-400/20 rounded-full animate-breathe" 
                     style={{ animationDelay: '0.3s' }}></div>
                {/* 呼吸环 3 */}
                <div className="absolute -inset-3 w-8 h-8 bg-blue-500/10 dark:bg-blue-400/10 rounded-full animate-breathe-slow"></div>
              </div>
            </div>
          )}
        </nav>
      </div>
    </div>
  )
}