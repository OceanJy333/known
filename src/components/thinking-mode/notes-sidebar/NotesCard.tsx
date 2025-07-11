'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { SearchCard } from './SearchCard'
import { CategorySelector, GroupByType } from './CategorySelector'
import { NotesTree } from './NotesTree'
import { KnowledgeNote } from '@/types/knowledge'
import { mockNotes } from '@/data/mockKnowledge'


interface NotesCardProps {
  onNoteSelect?: (note: KnowledgeNote) => void
}

export function NotesCard({ onNoteSelect }: NotesCardProps) {
  // 状态管理
  const [searchQuery, setSearchQuery] = useState('')
  const [groupBy, setGroupBy] = useState<GroupByType>('tags')
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
      } catch (e) {
        console.error('Failed to load preferences:', e)
      }
    }
  }, [])

  // 保存用户偏好
  useEffect(() => {
    const prefs = {
      groupBy,
      expandedGroups: Array.from(expandedGroups)
    }
    localStorage.setItem('thinking-mode-prefs', JSON.stringify(prefs))
  }, [groupBy, expandedGroups])

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
  }, [searchQuery])

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

  return (
    <div className="notes-card">
      <div className="card-header">
        <div className="header-content">
          <div className="header-left">
            <i className="fas fa-sticky-note header-icon"></i>
            <div className="header-text">
              <h3 className="card-title">知识笔记</h3>
              <p className="card-subtitle">搜索和管理您的笔记</p>
            </div>
          </div>
          <div className="header-right">
            <div className="notes-count">
              {filteredNotes.length}
            </div>
          </div>
        </div>
      </div>

      <div className="card-content">
        {/* 搜索框 */}
        <div className="card-section">
          <SearchCard
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery('')}
          />
        </div>

        {/* 分类切换器 - 仅在非搜索状态显示 */}
        {!searchQuery.trim() && (
          <div className="card-section">
            <CategorySelector
              value={groupBy}
              onChange={setGroupBy}
            />
          </div>
        )}

        {/* 笔记列表 */}
        <div className="card-section flex-1 overflow-hidden">
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
      </div>

      <style jsx>{`
        .notes-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.06),
            0 4px 16px rgba(0, 0, 0, 0.04);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .notes-card:hover {
          box-shadow: 
            0 12px 48px rgba(0, 0, 0, 0.1),
            0 6px 24px rgba(0, 0, 0, 0.06);
          transform: translateY(-2px);
          border-color: rgba(59, 130, 246, 0.3);
        }

        .card-header {
          padding: 20px;
          border-bottom: 1px solid rgba(226, 232, 240, 0.5);
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(10px);
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .header-icon {
          font-size: 20px;
          color: #3b82f6;
          width: 24px;
          text-align: center;
        }

        .header-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .card-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          line-height: 1.3;
        }

        .card-subtitle {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
          line-height: 1.3;
        }

        .header-right {
          display: flex;
          align-items: center;
        }

        .notes-count {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 36px;
          height: 28px;
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          font-size: 12px;
          font-weight: 600;
          border-radius: 14px;
          padding: 0 8px;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .card-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }

        .card-section {
          padding: 16px 20px;
        }

        .card-section:not(:last-child) {
          border-bottom: 1px solid rgba(226, 232, 240, 0.3);
        }

        .card-section.flex-1 {
          flex: 1;
          padding: 0;
          overflow-y: auto;
          min-height: 0;
        }

        /* 自定义滚动条 */
        .card-section::-webkit-scrollbar {
          width: 6px;
        }

        .card-section::-webkit-scrollbar-track {
          background: transparent;
        }

        .card-section::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 6px;
        }

        .card-section::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.3);
        }

        /* 暗色模式支持 */
        @media (prefers-color-scheme: dark) {
          .notes-card {
            background: rgba(15, 23, 42, 0.95);
            border-color: rgba(71, 85, 105, 0.8);
            box-shadow: 
              0 8px 32px rgba(0, 0, 0, 0.3),
              0 4px 16px rgba(0, 0, 0, 0.2);
          }

          .notes-card:hover {
            box-shadow: 
              0 12px 48px rgba(0, 0, 0, 0.4),
              0 6px 24px rgba(0, 0, 0, 0.3);
            border-color: rgba(59, 130, 246, 0.5);
          }

          .card-header {
            background: rgba(30, 41, 59, 0.8);
            border-bottom-color: rgba(71, 85, 105, 0.5);
          }

          .card-title {
            color: #e2e8f0;
          }

          .card-subtitle {
            color: #94a3b8;
          }

          .card-section:not(:last-child) {
            border-bottom-color: rgba(71, 85, 105, 0.3);
          }
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
          .card-header {
            padding: 16px;
          }

          .card-section {
            padding: 12px 16px;
          }

          .header-icon {
            font-size: 18px;
          }

          .card-title {
            font-size: 15px;
          }

          .card-subtitle {
            font-size: 11px;
          }

          .notes-count {
            min-width: 32px;
            height: 24px;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  )
}