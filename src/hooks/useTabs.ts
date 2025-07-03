'use client'

import { useState, useCallback } from 'react'
import { TabData, TabsState, TabsActions } from '@/types/tabs'

export function useTabs(): TabsState & TabsActions {
  const [tabs, setTabs] = useState<TabData[]>([])
  const [activeTabId, setActiveTabId] = useState<string | null>(null)
  const [nextTabId, setNextTabId] = useState<number>(1)

  const createTab = useCallback((title: string = '新文档'): string => {
    const newTab: TabData = {
      id: `tab-${nextTabId}`,
      title,
      filename: title,
      markdownContent: '',
      toc: [],
      isAnalyzing: false,
      createdAt: Date.now(),
      lastModified: Date.now()
    }

    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
    setNextTabId(prev => prev + 1)
    
    console.log('🆕 创建新标签页:', newTab.title, newTab.id)
    return newTab.id
  }, [nextTabId])

  const closeTab = useCallback((tabId: string) => {
    setTabs(prev => {
      const newTabs = prev.filter(tab => tab.id !== tabId)
      
      // 如果关闭的是当前活动标签页，切换到其他标签页
      if (activeTabId === tabId) {
        const currentIndex = prev.findIndex(tab => tab.id === tabId)
        if (newTabs.length > 0) {
          // 优先选择右边的标签页，如果没有则选择左边的
          const nextIndex = currentIndex < newTabs.length ? currentIndex : currentIndex - 1
          setActiveTabId(newTabs[nextIndex]?.id || null)
        } else {
          setActiveTabId(null)
        }
      }
      
      console.log('❌ 关闭标签页:', tabId)
      return newTabs
    })
  }, [activeTabId])

  const switchTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (tab) {
      setActiveTabId(tabId)
      console.log('🔄 切换到标签页:', tab.title, tabId)
    }
  }, [tabs])

  const updateTab = useCallback((tabId: string, updates: Partial<TabData>) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId 
        ? { ...tab, ...updates, lastModified: Date.now() }
        : tab
    ))
    console.log('📝 更新标签页:', tabId, Object.keys(updates))
  }, [])

  const getActiveTab = useCallback((): TabData | null => {
    return tabs.find(tab => tab.id === activeTabId) || null
  }, [tabs, activeTabId])

  return {
    tabs,
    activeTabId,
    nextTabId,
    createTab,
    closeTab,
    switchTab,
    updateTab,
    getActiveTab
  }
}