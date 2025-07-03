'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import ContentInput from '@/components/FileUpload'
import MarkdownRenderer from '@/components/MarkdownRenderer'
import FloatingTOC from '@/components/FloatingTOC'
import FloatingChat from '@/components/FloatingChat'
import TabBar from '@/components/TabBar'
import StructuredNotes from '@/components/StructuredNotes'
import GravityRopeDragHandle from '@/components/GravityRopeDragHandle'
import { useTabs } from '@/hooks/useTabs'
import { useDiffManager } from '@/hooks/useDiffManager'
import { TableOfContent } from '@/types/tabs'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

export default function Home() {
  // 标签页管理
  const { 
    tabs, 
    activeTabId, 
    createTab, 
    closeTab, 
    switchTab, 
    updateTab, 
    getActiveTab 
  } = useTabs()

  // Diff 管理
  const {
    diffs,
    acceptDiff,
    rejectDiff,
    acceptAllDiffs,
    rejectAllDiffs,
    getPendingDiffs,
    getAcceptedDiffs,
    addDiffs,
    applyAcceptedDiffs
  } = useDiffManager()

  // 当前标签页的本地状态
  const [isTocVisible, setIsTocVisible] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loadingMessage, setLoadingMessage] = useState<string>('正在处理内容...')
  
  // AI助手状态
  const [chatSize, setChatSize] = useState({ width: 400, height: 500 })
  // 结构化笔记状态
  const [isNotePanelOpen, setIsNotePanelOpen] = useState(false)
  const [structuredNotes, setStructuredNotes] = useState<string>('')
  // Diff 选中状态
  const [currentDiffId, setCurrentDiffId] = useState<string | undefined>()
  const [isDraggingHandle, setIsDraggingHandle] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  const [isTearing, setIsTearing] = useState(false)
  // 计算初始居中位置
  const getInitialPosition = () => {
    if (typeof window !== 'undefined') {
      return {
        x: (window.innerWidth - 400) / 2,
        y: (window.innerHeight - 500) / 2
      }
    }
    return { x: 100, y: 100 }
  }
  const [chatPosition, setChatPosition] = useState(getInitialPosition)
  const [forceExpanded, setForceExpanded] = useState(false)
  const [isAssistantVisible, setIsAssistantVisible] = useState(false)
  const [lastChatPosition, setLastChatPosition] = useState<{ x: number; y: number } | null>(null)

  // 获取当前活动标签页的数据
  const activeTab = getActiveTab()
  const markdownContent = activeTab?.markdownContent || ''
  const filename = activeTab?.filename || ''
  const toc = activeTab?.toc || []
  const isAnalyzing = activeTab?.isAnalyzing || false

  // 计算文档统计信息
  const wordCount = activeTab?.wordCount || markdownContent.length
  const readingTime = activeTab?.readingTime || Math.ceil(markdownContent.length / 500) // 按每分钟500字符计算
  const documentSummary = activeTab?.documentSummary
  

  // 缓存计算的 diff 数组，避免重复创建
  const pendingDiffs = useMemo(() => getPendingDiffs(), [diffs])
  const acceptedDiffs = useMemo(() => getAcceptedDiffs(), [diffs])

  const handleContentSubmit = async (content: string, name: string) => {
    setIsLoading(true)
    setLoadingMessage('正在准备文档...')
    
    try {
      // 如果没有活动标签页，创建一个新的
      let tabId = activeTabId
      if (!tabId) {
        tabId = createTab(name)
      }
      
      // 更新当前标签页的内容
      updateTab(tabId, {
        title: name,
        filename: name,
        markdownContent: content,
        toc: [],
        isAnalyzing: false
      })
      
      // 立即显示原文内容，不等待AI分析
      await new Promise(resolve => setTimeout(resolve, 300))
      setIsTocVisible(true)
      setIsLoading(false)
      
      // 在后台开始AI分析
      analyzeContentInBackground(content, name, tabId)
      
    } catch (error) {
      console.error('处理文档失败:', error)
      alert(error instanceof Error ? error.message : '文档处理失败，请重试')
      setIsLoading(false)
    }
  }

  // 后台流式分析函数
  const analyzeContentInBackground = async (content: string, name: string, tabId: string) => {
    // 标记标签页为分析中状态
    updateTab(tabId, { isAnalyzing: true })
    
    try {
      const response = await fetch('/api/analyze-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          fileType: name.split('.').pop() || 'txt',
          filename: name
        })
      })
      
      if (!response.ok) {
        throw new Error('分析请求失败')
      }

      if (!response.body) {
        throw new Error('响应流为空')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      const newSections: TableOfContent[] = []
      
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          
          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                
                switch (data.type) {
                  case 'start':
                  case 'progress':
                    // 显示真正的流式进度和内容预览
                    break
                    
                  case 'summary':
                    // 处理文档导读
                    const wordCount = content.length
                    const readingTime = Math.ceil(content.length / 500)
                    updateTab(tabId, { 
                      documentSummary: data.summary,
                      wordCount,
                      readingTime
                    })
                    break
                    
                  case 'section':
                    // 流式添加章节
                    newSections.push(data.section)
                    // 实时更新当前标签页的目录
                    updateTab(tabId, { toc: [...newSections] })
                    // 实时为新章节添加锚点，使其可以立即点击跳转
                    const currentContent = tabs.find(t => t.id === tabId)?.markdownContent || content
                    updateMarkdownWithAnchors(currentContent, newSections, tabId)
                    break
                    
                  case 'complete':
                    // 更新最终的markdown内容（带锚点）
                    if (newSections.length > 0) {
                      updateMarkdownWithAnchors(content, newSections, tabId)
                    }
                    // 如果还没有导读，使用complete事件中的数据
                    if (data.documentSummary && !tabs.find(t => t.id === tabId)?.documentSummary) {
                      const wordCount = content.length
                      const readingTime = Math.ceil(content.length / 500)
                      updateTab(tabId, { 
                        documentSummary: data.documentSummary,
                        wordCount,
                        readingTime
                      })
                    }
                    break
                    
                  case 'error':
                    throw new Error(data.error)
                }
              } catch (parseError) {
                console.warn('解析SSE数据失败:', parseError)
              }
            }
          }
        }
      } finally {
        reader.releaseLock()
      }
      
    } catch (error) {
      console.error('流式分析失败:', error)
      // 分析失败不影响用户阅读原文，只是没有AI目录
    } finally {
      // 标记分析完成
      updateTab(tabId, { isAnalyzing: false })
    }
  }

  // 为markdown内容添加锚点
  const updateMarkdownWithAnchors = (originalContent: string, sections: TableOfContent[], tabId: string) => {
    let processedContent = originalContent
    
    // 移除所有旧的锚点，避免重复
    processedContent = processedContent.replace(/<div id="[^"]*" class="section-anchor"><\/div>\n*/g, '')
    
    // 确保sections有有效的数据
    const validSections = sections.filter(s => s.location?.textAnchor && s.location.textAnchor.trim().length > 0)
    
    // 按原始位置从前往后排序
    const sectionsWithPos = validSections.map(section => ({
      ...section,
      position: processedContent.indexOf(section.location!.textAnchor!)
    })).filter(s => s.position !== -1)
    
    const sortedSections = sectionsWithPos.sort((a, b) => a.position - b.position)
    
    // 从前往后插入锚点，跟踪偏移量
    let offset = 0
    const anchorMarkup = `<div id="PLACEHOLDER_ID" class="section-anchor"></div>\n\n`
    
    sortedSections.forEach((section) => {
      const anchor = section.location!.textAnchor!
      const anchorIndex = processedContent.indexOf(anchor, offset)
      
      if (anchorIndex !== -1) {
        // 插入锚点
        const beforeAnchor = processedContent.substring(0, anchorIndex)
        const afterAnchor = processedContent.substring(anchorIndex)
        const anchorHtml = anchorMarkup.replace('PLACEHOLDER_ID', section.id)
        processedContent = beforeAnchor + anchorHtml + afterAnchor
        
        // 更新偏移量，下次从插入位置之后开始查找
        offset = anchorIndex + anchorHtml.length
      }
    })
    
    // 更新标签页的markdown内容
    updateTab(tabId, { markdownContent: processedContent })
  }


  const toggleToc = () => {
    setIsTocVisible(!isTocVisible)
  }
  

  const resetApp = () => {
    if (activeTabId) {
      closeTab(activeTabId)
    }
    setIsTocVisible(false)
    setIsLoading(false)
  }

  // 新建标签页
  const handleNewTab = () => {
    createTab()
    setIsTocVisible(false)
  }

  // 处理双击内容
  const handleDoubleClickContent = (clickPosition: { x: number; y: number }) => {
    // 计算聊天窗口位置，尽量靠近双击位置但不超出屏幕
    let newX = clickPosition.x - chatSize.width / 2
    let newY = clickPosition.y - chatSize.height / 2

    // 边界检查
    newX = Math.max(20, Math.min(newX, window.innerWidth - chatSize.width - 20))
    newY = Math.max(20, Math.min(newY, window.innerHeight - chatSize.height - 20))

    setChatPosition({ x: newX, y: newY })
    setIsAssistantVisible(true)
    setForceExpanded(true)
  }

  // 处理打开 AI 助手
  const handleOpenAssistant = () => {
    // 如果有上次的位置，使用上次的位置，否则居中显示
    if (lastChatPosition) {
      setChatPosition(lastChatPosition)
    } else {
      const centerX = (window.innerWidth - chatSize.width) / 2
      const centerY = (window.innerHeight - chatSize.height) / 2
      setChatPosition({ x: centerX, y: centerY })
    }
    
    setIsAssistantVisible(true)
    setForceExpanded(true)
  }

  // 处理关闭 AI 助手
  const handleCloseAssistant = () => {
    // 保存当前位置
    setLastChatPosition(chatPosition)
    setIsAssistantVisible(false)
    setForceExpanded(false)
  }

  // 处理重力绳子拖拽
  const handleRopeDragStart = () => {
    setIsDraggingHandle(true)
    setIsTearing(true)
  }

  const handleRopeDragEnd = () => {
    setIsDraggingHandle(false)
    setIsTearing(false)
    
    // 如果拖拽进度超过阈值，打开笔记面板
    if (dragProgress > 0.7) {
      setIsNotePanelOpen(true)
    }
    
    setDragProgress(0)
  }

  const handleRopeDragProgress = (progress: number) => {
    setDragProgress(progress)
    
    // 达到阈值时自动打开
    if (progress >= 1) {
      setIsNotePanelOpen(true)
      setIsDraggingHandle(false)
      setIsTearing(false)
      setDragProgress(0)
    }
  }

  // iOS 风格滚动条处理
  useEffect(() => {
    const scrollContainers = document.querySelectorAll('.ios-scrollbar')
    
    scrollContainers.forEach((container) => {
      let scrollTimeout: NodeJS.Timeout
      
      const handleScroll = () => {
        container.classList.add('scrolling')
        
        clearTimeout(scrollTimeout)
        scrollTimeout = setTimeout(() => {
          container.classList.remove('scrolling')
        }, 1500) // 1.5秒后隐藏滚动条
      }
      
      container.addEventListener('scroll', handleScroll, { passive: true })
      
      return () => {
        container.removeEventListener('scroll', handleScroll)
        clearTimeout(scrollTimeout)
      }
    })
  }, [markdownContent, isNotePanelOpen])

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 全局快捷键
      if (e.key === 't' && (e.metaKey || e.ctrlKey) && !e.shiftKey) {
        e.preventDefault()
        handleNewTab()
        return
      }
      
      if (e.key === 'w' && (e.metaKey || e.ctrlKey) && activeTabId) {
        e.preventDefault()
        closeTab(activeTabId)
        return
      }
      
      // 数字键切换标签页
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault()
        const index = parseInt(e.key) - 1
        if (tabs[index]) {
          switchTab(tabs[index].id)
        }
        return
      }
      
      // 当前标签页相关快捷键
      if (markdownContent) {
        if (e.key === 'Escape') {
          setIsTocVisible(false)
          setIsNotePanelOpen(false)
        } else if (e.key === 't' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
          e.preventDefault()
          setIsTocVisible(prev => !prev)
        } else if (e.key === 'n' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
          e.preventDefault()
          setIsNotePanelOpen(prev => !prev)
        } else if (e.key === 'r' && (e.metaKey || e.ctrlKey) && e.shiftKey) {
          e.preventDefault()
          resetApp()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [markdownContent, activeTabId, tabs, handleNewTab, closeTab, switchTab, resetApp])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-400 rounded-full animate-spin mx-auto" style={{ animationDelay: '0.15s' }}></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {loadingMessage}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              这可能需要几秒钟时间...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* 标签页栏 */}
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSwitch={switchTab}
        onTabClose={closeTab}
        onNewTab={handleNewTab}
        onOpenAssistant={handleOpenAssistant}
        isAssistantVisible={isAssistantVisible}
      />

      {/* 主内容区域 */}
      <div className="flex-1" style={{ height: 'calc(100vh - 32px)', paddingTop: '32px' }}>
        {!markdownContent ? (
        // 内容输入界面
        <div className="h-full flex flex-col items-center justify-center px-6 py-12">
          <div className="text-center mb-8 fade-in">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mb-3 shadow-lg">
              <i className="fab fa-markdown text-xl text-white"></i>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent mb-2">
              沉淀
            </h1>
          </div>
          
          <ContentInput onContentSubmit={handleContentSubmit} />
        </div>
      ) : (
        // 阅读界面
        <div className="relative h-full">
          {/* 分屏布局 */}
          <PanelGroup direction="horizontal" className="h-full px-1 py-1">
            {/* 左侧原文区域 */}
            <Panel defaultSize={isNotePanelOpen ? 50 : 100} minSize={30}>
              <div className="h-full px-0 py-1">
                <div className={`content-card ${isTearing ? 'tear-effect tearing' : ''}`} style={{height: 'calc(100vh - 44px)'}}>
                  <div className="h-full flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto ios-scrollbar">
                      <div className="container mx-auto px-4 pt-12 pb-6 max-w-4xl">
            {/* 简化的文档头部 */}
            <header className="mb-4 fade-in">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
                  {filename}
                </h1>
                
                {/* 快捷键提示 */}
                <div className="hidden md:flex items-center space-x-1.5 text-xs text-gray-400 dark:text-gray-500">
                  <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">⌘/Ctrl + T</span>
                  <span className="text-xs">目录</span>
                  <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs">ESC</span>
                  <span className="text-xs">关闭</span>
                </div>
              </div>
              
              <div className="h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>
            </header>

            {/* Markdown 内容 */}
            <main className="fade-in">
              <MarkdownRenderer
                content={markdownContent}
                onDoubleClick={handleDoubleClickContent}
                diffs={[]} 
                currentDiffId={undefined}
                onDiffClick={() => {}}
                onAcceptDiff={() => {}}
                onRejectDiff={() => {}}
              />
                        {/* 底部空白区域，让最后章节能滚动到中心 */}
                        <div className="h-64"></div>
                      </main>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Panel>

          {/* 重力绳子拖拽手柄 */}
          {!isNotePanelOpen && markdownContent && (
            <GravityRopeDragHandle
              onDragStart={handleRopeDragStart}
              onDragEnd={handleRopeDragEnd}
              onDragProgress={handleRopeDragProgress}
              isDragging={isDraggingHandle}
            />
          )}

          {/* 分屏调整手柄 */}
          {isNotePanelOpen && (
            <PanelResizeHandle className="w-1 bg-gray-300 dark:bg-gray-600 hover:bg-blue-400 dark:hover:bg-blue-500 transition-colors" />
          )}

          {/* 右侧笔记区域 */}
          {isNotePanelOpen && (
            <Panel defaultSize={50} minSize={30}>
              <div className="h-full px-0 py-1">
                <div className="content-card" style={{height: 'calc(100vh - 44px)'}}>
                  <StructuredNotes
                    originalContent={markdownContent}
                    onClose={() => setIsNotePanelOpen(false)}
                    onHideToc={() => setIsTocVisible(false)}
                    diffs={[...pendingDiffs, ...acceptedDiffs]}
                    currentDiffId={currentDiffId}
                    onDiffClick={setCurrentDiffId}
                    onAcceptDiff={acceptDiff}
                    onRejectDiff={rejectDiff}
                    applyAcceptedDiffs={applyAcceptedDiffs}
                    onNotesChange={setStructuredNotes}
                  />
                </div>
              </div>
            </Panel>
          )}
        </PanelGroup>

          {/* 浮动目录 */}
          <FloatingTOC
            toc={toc}
            isVisible={isTocVisible}
            onToggle={toggleToc}
            isAnalyzing={isAnalyzing}
            wordCount={wordCount}
            readingTime={readingTime}
            documentSummary={documentSummary}
          />

          {/* AI助手 */}
          <FloatingChat
            isVisible={isAssistantVisible}
            onClose={handleCloseAssistant}
            position={chatPosition}
            onPositionChange={setChatPosition}
            size={chatSize}
            onSizeChange={setChatSize}
            originalContent={markdownContent}
            structuredNotes={structuredNotes}
            forceExpanded={forceExpanded}
            onExpandedChange={setForceExpanded}
            pendingDiffs={pendingDiffs}
            allDiffs={diffs}
            onAcceptDiff={acceptDiff}
            onRejectDiff={rejectDiff}
            onAcceptAllDiffs={acceptAllDiffs}
            onRejectAllDiffs={rejectAllDiffs}
            onAddDiff={(diff) => addDiffs([diff])}
          />
        </div>
        )}
      </div>
      
    </div>
  )
}