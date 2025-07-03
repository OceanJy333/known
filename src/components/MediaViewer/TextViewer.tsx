'use client'

import { useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { MediaViewerProps, MediaType } from '@/types/media'

export default function TextViewer({ 
  file, 
  sections, 
  currentSection, 
  onSectionChange, 
  onNavigate 
}: MediaViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // 监听滚动，更新当前段落
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollTop = container.scrollTop
      const containerHeight = container.clientHeight
      
      // 找到当前可见的段落
      for (const section of sections) {
        const element = document.getElementById(section.id)
        if (element) {
          const rect = element.getBoundingClientRect()
          const containerRect = container.getBoundingClientRect()
          
          // 检查元素是否在视窗内
          if (rect.top >= containerRect.top && 
              rect.top <= containerRect.top + containerHeight / 2) {
            if (currentSection !== section.id) {
              onSectionChange?.(section.id)
            }
            break
          }
        }
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [sections, currentSection, onSectionChange])

  // 处理导航请求
  const handleNavigation = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId)
    if (section && onNavigate) {
      onNavigate({
        sectionId,
        mediaType: file.type,
        location: section.location,
        behavior: 'smooth'
      })
    }
  }

  // 执行跳转
  useEffect(() => {
    if (currentSection) {
      const element = document.getElementById(currentSection)
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }
    }
  }, [currentSection])

  const content = file.content || ''
  const isMarkdown = file.type === MediaType.MARKDOWN

  return (
    <div 
      ref={containerRef}
      className="text-viewer w-full h-full overflow-y-auto p-6"
    >
      {isMarkdown ? (
        <div className="markdown-content prose prose-lg max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
          >
            {content}
          </ReactMarkdown>
        </div>
      ) : (
        <div className="text-content whitespace-pre-wrap font-mono text-sm leading-relaxed">
          {content}
        </div>
      )}
    </div>
  )
}