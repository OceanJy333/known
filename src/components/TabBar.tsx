'use client'

import { useState } from 'react'
import { TabData } from '@/types/tabs'

interface TabBarProps {
  tabs: TabData[]
  activeTabId: string | null
  onTabSwitch: (tabId: string) => void
  onTabClose: (tabId: string) => void
  onNewTab: () => void
  onOpenAssistant?: () => void
  isAssistantVisible?: boolean
}

interface TabItemProps {
  tab: TabData
  isActive: boolean
  onSwitch: () => void
  onClose: () => void
}

function TabItem({ tab, isActive, onSwitch, onClose }: TabItemProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
  }

  return (
    <div
      className={`group relative flex items-center min-w-0 max-w-xs px-3 py-1.5 text-xs font-medium cursor-pointer transition-all duration-200 ${
        isActive
          ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 border-b-2 border-blue-500'
          : 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600 hover:text-gray-800 dark:hover:text-gray-200'
      }`}
      onClick={onSwitch}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={tab.filename}
    >
      {/* 文件图标 */}
      <div className="flex-shrink-0 mr-1.5">
        <i className="fas fa-file-alt text-xs opacity-60"></i>
      </div>

      {/* 标签标题 */}
      <div className="flex-1 min-w-0 flex items-center">
        <span className="truncate">
          {tab.title}
        </span>
        
        {/* 分析中指示器 */}
        {tab.isAnalyzing && (
          <div className="ml-1.5 flex-shrink-0">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>

      {/* 关闭按钮 */}
      <button
        onClick={handleClose}
        className={`flex-shrink-0 ml-1.5 p-0.5 rounded-full transition-all duration-200 ${
          isHovered || isActive
            ? 'opacity-100 hover:bg-gray-200 dark:hover:bg-slate-600'
            : 'opacity-0 group-hover:opacity-100'
        }`}
        title="关闭标签页"
      >
        <i className="fas fa-times text-xs"></i>
      </button>

      {/* 活动状态指示器 */}
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"></div>
      )}
    </div>
  )
}

export default function TabBar({ tabs, activeTabId, onTabSwitch, onTabClose, onNewTab, onOpenAssistant, isAssistantVisible }: TabBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gray-100 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
      <div className="flex items-center">
        {/* 标签页列表 */}
        <div className="flex-1 flex items-center overflow-x-auto hide-scrollbar">
          <div className="flex">
            {tabs.map(tab => (
              <TabItem
                key={tab.id}
                tab={tab}
                isActive={tab.id === activeTabId}
                onSwitch={() => onTabSwitch(tab.id)}
                onClose={() => onTabClose(tab.id)}
              />
            ))}
          </div>
        </div>

        {/* 新建标签页按钮 */}
        <div className="flex-shrink-0 px-1.5">
          <button
            onClick={onNewTab}
            className="flex items-center justify-center w-6 h-6 rounded-md text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200"
            title="新建标签页 (Ctrl+T)"
          >
            <i className="fas fa-plus text-xs"></i>
          </button>
        </div>

        {/* AI 助手按钮 */}
        {onOpenAssistant && !isAssistantVisible && (
          <div className="flex-shrink-0 pr-1.5">
            <button
              onClick={onOpenAssistant}
              className="flex items-center justify-center px-2.5 py-0.5 h-6 rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-blue-500 hover:border-blue-500 hover:text-white transition-all duration-200 group"
              title="打开AI助手"
            >
              <i className="fas fa-comment-dots text-xs mr-1"></i>
              <span className="text-xs font-medium">Ask</span>
            </button>
          </div>
        )}
      </div>

    </div>
  )
}