'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { SearchCard } from './SearchCard'
import { CategorySelector } from './CategorySelector'
import { NotesTree } from './NotesTree'
import { QuickFilters } from './QuickFilters'
import { KnowledgeNote } from '@/types/knowledge'
import { mockNotes } from '@/data/mockKnowledge'

export type GroupByType = 'tags' | 'time' | 'category'
export type QuickFilterType = 'favorite' | 'recent' | 'trending'

interface NotesSidebarProps {
  onNoteSelect?: (note: KnowledgeNote) => void
}

export function NotesSidebar({ onNoteSelect }: NotesSidebarProps) {
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('')
  const [groupBy, setGroupBy] = useState<GroupByType>('tags')
  const [quickFilters, setQuickFilters] = useState<Set<QuickFilterType>>(new Set())
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)

  // 从localStorage恢复用户偏好
  useEffect(() => {
    const savedPrefs = localStorage.getItem('thinking-mode-prefs')
    if (savedPrefs) {
      try {
        const prefs = JSON.parse(savedPrefs)
        setGroupBy(prefs.groupBy || 'tags')
        setExpandedGroups(new Set(prefs.expandedGroups || []))
        setQuickFilters(new Set(prefs.quickFilters || []))
      } catch (e) {
        console.error('Failed to load preferences:', e)
      }
    }
  }, [])

  // 保存用户偏好
  useEffect(() => {
    const prefs = {
      groupBy,
      expandedGroups: Array.from(expandedGroups),
      quickFilters: Array.from(quickFilters)
    }
    localStorage.setItem('thinking-mode-prefs', JSON.stringify(prefs))
  }, [groupBy, expandedGroups, quickFilters])

  // 计算搜索分数的辅助函数
  const calculateSearchScore = (note: KnowledgeNote, query: string): number => {
    let score = 0
    const lowerQuery = query.toLowerCase()
    
    if (note.title.toLowerCase().includes(lowerQuery)) {
      score += 100
    }
    
    const hasTagMatch = note.tags.some(tagId => 
      tagId.toLowerCase().includes(lowerQuery)
    )
    if (hasTagMatch) {
      score += 50
    }
    
    const contentPreview = note.content.slice(0, 500).toLowerCase()
    if (contentPreview.includes(lowerQuery)) {
      score += 10
    }
    
    return score
  }

  // 搜索和筛选逻辑
  const filteredNotes = useMemo(() => {
    let notes = [...mockNotes]

    // 应用快捷筛选
    if (quickFilters.has('favorite')) {
      notes = notes.filter(note => note.isFavorite)
    }
    if (quickFilters.has('recent')) {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      notes = notes.filter(note => 
        new Date(note.lastAccessed) >= sevenDaysAgo
      )
    }
    if (quickFilters.has('trending')) {
      notes = notes
        .sort((a, b) => b.accessCount - a.accessCount)
        .slice(0, 10)
    }

    // 应用搜索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      notes = notes.filter(note => {
        // 计算匹配分数
        let score = 0
        
        // 标题匹配（100分）
        if (note.title.toLowerCase().includes(query)) {
          score += 100
        }
        
        // 标签匹配（50分）
        const hasTagMatch = note.tags.some(tagId => {
          // 这里简化处理，实际应该查找tag名称
          return tagId.toLowerCase().includes(query)
        })
        if (hasTagMatch) {
          score += 50
        }
        
        // 内容匹配（10分）
        const contentPreview = note.content.slice(0, 500).toLowerCase()
        if (contentPreview.includes(query)) {
          score += 10
        }
        
        // 只返回有匹配的笔记
        return score > 0
      }).sort((a, b) => {
        // 按匹配分数排序
        const scoreA = calculateSearchScore(a, query)
        const scoreB = calculateSearchScore(b, query)
        if (scoreA !== scoreB) return scoreB - scoreA
        
        // 分数相同按时间排序
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      })
    }

    return notes
  }, [searchQuery, quickFilters])

  // 处理笔记选择
  const handleNoteSelect = (note: KnowledgeNote) => {
    setSelectedNoteId(note.id)
    onNoteSelect?.(note)
  }

  // 处理分组展开/折叠
  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  // 处理快捷筛选
  const toggleQuickFilter = (filter: QuickFilterType) => {
    const newFilters = new Set(quickFilters)
    if (newFilters.has(filter)) {
      newFilters.delete(filter)
    } else {
      newFilters.add(filter)
    }
    setQuickFilters(newFilters)
  }

  return (
    <aside className="notes-sidebar">
      <div className="sidebar-content">
        {/* 搜索框 */}
        <div className="sidebar-section">
          <SearchCard
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
        </div>

        {/* 分类切换器 - 仅在非搜索状态显示 */}
        {!searchQuery.trim() && (
          <div className="sidebar-section">
            <CategorySelector
              value={groupBy}
              onChange={setGroupBy}
            />
          </div>
        )}

        {/* 笔记列表 */}
        <div className="sidebar-section flex-1 overflow-hidden">
          <NotesTree
            notes={filteredNotes}
            groupBy={searchQuery.trim() ? null : groupBy}
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroup}
            selectedNoteId={selectedNoteId}
            onSelectNote={handleNoteSelect}
            isSearching={!!searchQuery.trim()}
          />
        </div>

        {/* 快捷筛选栏 */}
        <div className="sidebar-section sidebar-footer">
          <QuickFilters
            activeFilters={quickFilters}
            onToggleFilter={toggleQuickFilter}
          />
        </div>
      </div>

      <style jsx>{`
        .notes-sidebar {
          width: 100%;
          height: 100%;
          background: #f8fafc;
          border-right: 1px solid rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
        }

        .sidebar-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }

        .sidebar-section {
          padding: 16px;
        }

        .sidebar-section:not(:last-child) {
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .sidebar-section.flex-1 {
          flex: 1;
          padding: 0;
          overflow-y: auto;
        }

        .sidebar-footer {
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(8px);
        }

        /* 自定义滚动条 */
        .sidebar-section::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-section::-webkit-scrollbar-track {
          background: transparent;
        }

        .sidebar-section::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }

        .sidebar-section::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.2);
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .notes-sidebar {
            position: fixed;
            left: 0;
            top: 0;
            height: 100vh;
            z-index: 1000;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
          }

          .notes-sidebar.mobile-open {
            transform: translateX(0);
          }
        }
      `}</style>
    </aside>
  )
}