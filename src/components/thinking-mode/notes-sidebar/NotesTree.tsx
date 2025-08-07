'use client'

import React, { useMemo } from 'react'
import { KnowledgeNote } from '@/types/knowledge'
import { mockTags, mockCategories } from '@/data/mockKnowledge'
import { GroupByType } from './CategorySelector'
import { NoteItem } from './NoteItem'

interface GroupedNotes {
  [groupId: string]: {
    label: string
    notes: KnowledgeNote[]
    count: number
  }
}

interface NotesTreeProps {
  notes: KnowledgeNote[]
  groupBy: GroupByType | null
  expandedGroups: Set<string>
  onToggleGroup: (groupId: string) => void
  selectedNoteId: string | null
  onSelectNote: (note: KnowledgeNote) => void
  isSearching: boolean
}

export function NotesTree({
  notes,
  groupBy,
  expandedGroups,
  onToggleGroup,
  selectedNoteId,
  onSelectNote,
  isSearching
}: NotesTreeProps) {
  // 分组逻辑
  const groupedNotes = useMemo(() => {
    if (!groupBy || isSearching) {
      return null
    }

    const groups: GroupedNotes = {}

    switch (groupBy) {
      case 'tags':
        // 按标签分组
        notes.forEach(note => {
          if (note.tags.length === 0) {
            const groupId = 'uncategorized'
            if (!groups[groupId]) {
              groups[groupId] = {
                label: '未分类',
                notes: [],
                count: 0
              }
            }
            groups[groupId].notes.push(note)
            groups[groupId].count++
          } else {
            note.tags.forEach(tagId => {
              const tag = mockTags.find(t => t.id === tagId)
              if (tag) {
                const groupId = tag.id
                if (!groups[groupId]) {
                  groups[groupId] = {
                    label: tag.name,
                    notes: [],
                    count: 0
                  }
                }
                groups[groupId].notes.push(note)
                groups[groupId].count++
              }
            })
          }
        })
        break

      case 'category':
        // 按分类分组
        notes.forEach(note => {
          const category = mockCategories.find(c => c.id === note.category)
          const groupId = note.category || 'uncategorized'
          
          if (!groups[groupId]) {
            groups[groupId] = {
              label: category?.name || '未分类',
              notes: [],
              count: 0
            }
          }
          groups[groupId].notes.push(note)
          groups[groupId].count++
        })
        break

      case 'time':
        // 按时间分组
        const now = new Date()
        notes.forEach(note => {
          const noteDate = new Date(note.createdAt)
          const daysDiff = Math.floor((now.getTime() - noteDate.getTime()) / (1000 * 60 * 60 * 24))
          
          let groupId: string
          let label: string
          
          if (daysDiff === 0) {
            groupId = 'today'
            label = '今天'
          } else if (daysDiff <= 7) {
            groupId = 'thisWeek'
            label = '本周'
          } else if (daysDiff <= 30) {
            groupId = 'thisMonth'
            label = '本月'
          } else if (daysDiff <= 365) {
            groupId = 'thisYear'
            label = '今年'
          } else {
            groupId = 'earlier'
            label = '更早'
          }
          
          if (!groups[groupId]) {
            groups[groupId] = {
              label,
              notes: [],
              count: 0
            }
          }
          groups[groupId].notes.push(note)
          groups[groupId].count++
        })
        break
    }

    return groups
  }, [notes, groupBy, isSearching])

  // 渲染分组视图
  const renderGroupedView = () => {
    if (!groupedNotes) return null

    const groupIds = Object.keys(groupedNotes).sort((a, b) => {
      // 自定义排序逻辑
      if (groupBy === 'time') {
        const timeOrder = ['today', 'thisWeek', 'thisMonth', 'thisYear', 'earlier']
        return timeOrder.indexOf(a) - timeOrder.indexOf(b)
      }
      // 其他情况按笔记数量排序
      return groupedNotes[b].count - groupedNotes[a].count
    })

    return (
      <div className="notes-tree-grouped">
        {/* 总数显示 */}
        <div className="tree-header">
          <div className="total-count">
            <span>全部笔记 ({notes.length})</span>
          </div>
        </div>

        {/* 分组列表 */}
        <div className="groups-list">
          {groupIds.map(groupId => {
            const group = groupedNotes[groupId]
            const isExpanded = expandedGroups.has(groupId)
            
            return (
              <div key={groupId} className="group-item">
                <button
                  className="group-header"
                  onClick={() => onToggleGroup(groupId)}
                >
                  <div className="group-info">
                    <span className="expand-icon">{isExpanded ? '−' : '+'}</span>
                    <span className="group-label">{group.label}</span>
                    <span className="group-count">({group.count})</span>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="group-content">
                    {group.notes.map(note => (
                      <NoteItem
                        key={note.id}
                        note={note}
                        isSelected={selectedNoteId === note.id}
                        onSelect={() => onSelectNote(note)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // 渲染搜索结果视图
  const renderSearchView = () => {
    return (
      <div className="notes-tree-search">
        <div className="search-header">
          <div className="search-count">
            <span>找到 {notes.length} 条相关笔记</span>
          </div>
        </div>
        
        <div className="search-results">
          {notes.map(note => (
            <NoteItem
              key={note.id}
              note={note}
              isSelected={selectedNoteId === note.id}
              onSelect={() => onSelectNote(note)}
              showRelevance={true}
            />
          ))}
        </div>
      </div>
    )
  }

  // 空状态渲染
  const renderEmptyState = () => {
    return (
      <div className="empty-state">
        <div className="empty-title">
          {isSearching ? '没有找到相关笔记' : '还没有笔记'}
        </div>
        <div className="empty-description">
          {isSearching 
            ? '换个关键词试试？' 
            : '从沉淀模式创建第一篇笔记吧'
          }
        </div>
      </div>
    )
  }

  return (
    <div className="notes-tree">
      {notes.length === 0 ? (
        renderEmptyState()
      ) : isSearching ? (
        renderSearchView()
      ) : (
        renderGroupedView()
      )}

      <style jsx>{`
        .notes-tree {
          height: 100%;
          overflow-y: auto;
          padding: 16px;
        }

        .tree-header,
        .search-header {
          margin-bottom: 16px;
        }

        .total-count,
        .search-count {
          display: flex;
          align-items: center;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          padding: 8px 12px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }


        .groups-list {
          space-y: 4px;
        }

        .group-item {
          margin-bottom: 4px;
        }

        .group-header {
          width: 100%;
          background: transparent;
          border: none;
          padding: 12px 8px;
          cursor: pointer;
          border-radius: 12px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }

        .group-header:hover {
          background: rgba(0, 0, 0, 0.03);
        }

        .group-info {
          display: flex;
          align-items: center;
          text-align: left;
        }

        .expand-icon {
          width: 16px;
          margin-right: 8px;
          color: #6b7280;
          font-size: 14px;
          font-weight: 500;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }


        .group-label {
          flex: 1;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
          letter-spacing: 0.025em;
        }

        .group-count {
          font-size: 12px;
          color: #6b7280;
          margin-left: 4px;
        }

        .group-content {
          margin-left: 24px;
          margin-top: 8px;
          padding-left: 12px;
          border-left: 2px solid rgba(59, 130, 246, 0.15);
        }


        .search-results {
          space-y: 2px;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 200px;
          text-align: center;
          padding: 32px 16px;
        }


        .empty-title {
          font-size: 16px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
        }

        .empty-description {
          font-size: 14px;
          color: #6b7280;
        }

        /* 自定义滚动条 */
        .notes-tree::-webkit-scrollbar {
          width: 6px;
        }

        .notes-tree::-webkit-scrollbar-track {
          background: transparent;
        }

        .notes-tree::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }

        .notes-tree::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.15);
        }

        /* 暗色模式 */
        @media (prefers-color-scheme: dark) {
          .total-count,
          .search-count {
            background: rgba(0, 0, 0, 0.2);
            color: #e5e7eb;
            border-color: rgba(255, 255, 255, 0.06);
          }


          .group-header:hover {
            background: rgba(255, 255, 255, 0.05);
          }

          .expand-icon {
            color: #9ca3af;
          }

          .group-label {
            color: #e5e7eb;
          }

          .group-count {
            color: #9ca3af;
          }

          .group-content {
            border-left-color: rgba(255, 255, 255, 0.08);
          }


          .empty-title {
            color: #e5e7eb;
          }

          .empty-description {
            color: #9ca3af;
          }
        }

        /* 移动端适配 */
        @media (max-width: 768px) {
          .notes-tree {
            padding: 12px;
          }

          .total-count,
          .search-count {
            font-size: 13px;
            padding: 6px 10px;
          }

          .group-label {
            font-size: 13px;
          }

          .group-count {
            font-size: 11px;
          }

          .empty-state {
            height: 150px;
            padding: 24px 16px;
          }

          .empty-title {
            font-size: 15px;
          }

          .empty-description {
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  )
}