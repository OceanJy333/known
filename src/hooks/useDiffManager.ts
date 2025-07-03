'use client'

import { useState, useCallback } from 'react'
import { DiffAction } from '@/components/DiffCard'

// 解析 SEARCH/REPLACE 格式的 diff
function parseSearchReplaceDiff(diffContent: string) {
  // 支持多种格式的 SEARCH/REPLACE 标记
  const searchMatch = diffContent.match(/---+\s*SEARCH\s*([\s\S]*?)\s*=+/i)
  const replaceMatch = diffContent.match(/=+\s*([\s\S]*?)\s*\++\s*REPLACE/i)

  return {
    searchContent: searchMatch ? searchMatch[1].trim() : '',
    replaceContent: replaceMatch ? replaceMatch[1].trim() : ''
  }
}

export function useDiffManager() {
  const [diffs, setDiffs] = useState<DiffAction[]>([])

  // 添加新的 diff（带去重和验证）
  const addDiff = useCallback((diff: DiffAction) => {
    // 验证 diff 的有效性
    if (!diff.id || !diff.type) {
      console.warn('Invalid diff object:', diff)
      return
    }

    // 对于不同类型的 diff，验证不同的必需字段
    if (diff.type === 'search_replace') {
      if (!diff.diff) {
        console.warn('search_replace diff missing diff field:', diff)
        return
      }
    } else {
      if (!diff.content) {
        console.warn('Traditional diff missing content field:', diff)
        return
      }
    }

    setDiffs(prev => {
      // 使用 Map 提高查找性能
      const diffMap = new Map(prev.map(d => [d.id, d]))
      
      // 如果存在相同 ID，检查是否需要更新
      const existing = diffMap.get(diff.id)
      if (existing) {
        // 只有当内容真正不同时才更新
        if (JSON.stringify(existing) !== JSON.stringify(diff)) {
          diffMap.set(diff.id, diff)
          console.log('Updated diff:', diff.id)
        }
      } else {
        diffMap.set(diff.id, diff)
        console.log('Added new diff:', diff.id)
      }
      
      return Array.from(diffMap.values())
    })
  }, [])

  // 添加多个 diffs（批量优化）
  const addDiffs = useCallback((newDiffs: DiffAction[]) => {
    if (!newDiffs.length) return
    
    // 过滤和验证新的 diffs
    const validDiffs = newDiffs.filter(diff => {
      if (!diff.id || !diff.type) {
        console.warn('Invalid diff in batch:', diff)
        return false
      }

      // 对于不同类型的 diff，验证不同的必需字段
      if (diff.type === 'search_replace') {
        if (!diff.diff) {
          console.warn('search_replace diff missing diff field in batch:', diff)
          return false
        }
      } else {
        if (!diff.content) {
          console.warn('Traditional diff missing content field in batch:', diff)
          return false
        }
      }

      return true
    })

    if (!validDiffs.length) return

    setDiffs(prev => {
      const diffMap = new Map(prev.map(d => [d.id, d]))
      let hasChanges = false
      
      validDiffs.forEach(newDiff => {
        const existing = diffMap.get(newDiff.id)
        if (!existing || JSON.stringify(existing) !== JSON.stringify(newDiff)) {
          diffMap.set(newDiff.id, newDiff)
          hasChanges = true
        }
      })
      
      if (hasChanges) {
        console.log('Batch updated diffs:', validDiffs.map(d => d.id))
        return Array.from(diffMap.values())
      }
      
      return prev // 无变化时返回原数组，避免不必要的重渲染
    })
  }, [])

  // 更新 diff 状态
  const updateDiffStatus = useCallback((diffId: string, status: DiffAction['status']) => {
    setDiffs(prev => 
      prev.map(diff => 
        diff.id === diffId 
          ? { ...diff, status }
          : diff
      )
    )
  }, [])

  // 接受单个 diff
  const acceptDiff = useCallback((diffId: string) => {
    updateDiffStatus(diffId, 'accepted')
  }, [updateDiffStatus])

  // 拒绝单个 diff
  const rejectDiff = useCallback((diffId: string) => {
    updateDiffStatus(diffId, 'rejected')
  }, [updateDiffStatus])

  // 接受所有待处理的 diffs
  const acceptAllDiffs = useCallback(() => {
    setDiffs(prev => 
      prev.map(diff => 
        diff.status === 'pending' 
          ? { ...diff, status: 'accepted' as const }
          : diff
      )
    )
  }, [])

  // 拒绝所有待处理的 diffs
  const rejectAllDiffs = useCallback(() => {
    setDiffs(prev => 
      prev.map(diff => 
        diff.status === 'pending' 
          ? { ...diff, status: 'rejected' as const }
          : diff
      )
    )
  }, [])

  // 清除所有 diffs
  const clearDiffs = useCallback(() => {
    setDiffs([])
  }, [])

  // 清除已处理的 diffs
  const clearProcessedDiffs = useCallback(() => {
    setDiffs(prev => prev.filter(diff => diff.status === 'pending'))
  }, [])

  // 获取统计信息
  const getStats = useCallback(() => {
    const pending = diffs.filter(d => d.status === 'pending').length
    const accepted = diffs.filter(d => d.status === 'accepted').length
    const rejected = diffs.filter(d => d.status === 'rejected').length
    
    return {
      total: diffs.length,
      pending,
      accepted,
      rejected,
      processed: accepted + rejected
    }
  }, [diffs])

  // 获取待处理的 diffs
  const getPendingDiffs = useCallback(() => {
    return diffs.filter(diff => diff.status === 'pending')
  }, [diffs])

  // 获取已接受的 diffs（用于应用到笔记）
  const getAcceptedDiffs = useCallback(() => {
    return diffs.filter(diff => diff.status === 'accepted')
  }, [diffs])

  // 重试失败的 diff
  const retryDiff = useCallback((diffId: string, retryReason?: string) => {
    setDiffs(prev => {
      const targetDiff = prev.find(d => d.id === diffId)
      if (!targetDiff || targetDiff.status !== 'failed') {
        console.warn('无法重试 diff:', diffId, '状态:', targetDiff?.status)
        return prev
      }

      // 创建重试版本的 diff
      const retryCount = (targetDiff.metadata?.retryCount || 0) + 1
      const retryDiff: DiffAction = {
        ...targetDiff,
        id: `${diffId}_retry_${retryCount}_${Date.now()}`,
        status: 'retrying',
        metadata: {
          ...targetDiff.metadata,
          retryCount,
          parentId: diffId,
          retryReason: retryReason || targetDiff.metadata?.error?.message || '修改失败，正在重试'
        }
      }

      console.log(`🔄 创建重试 diff:`, retryDiff.id, '原因:', retryReason)

      // 替换原有的失败 diff
      return prev.map(d => d.id === diffId ? retryDiff : d)
    })

    // 返回新的重试 diff ID，用于触发 AI 重新生成
    const newRetryId = `${diffId}_retry_${(diffs.find(d => d.id === diffId)?.metadata?.retryCount || 0) + 1}_${Date.now()}`
    return newRetryId
  }, [diffs])

  // 标记重试完成（成功或失败）
  const completeRetry = useCallback((retryDiffId: string, success: boolean, newDiff?: DiffAction) => {
    setDiffs(prev => 
      prev.map(diff => {
        if (diff.id === retryDiffId) {
          if (success && newDiff) {
            // 重试成功，使用新的 diff 替换
            return {
              ...newDiff,
              id: retryDiffId, // 保持重试 ID
              metadata: {
                ...newDiff.metadata,
                retryCount: diff.metadata?.retryCount,
                parentId: diff.metadata?.parentId,
                retryReason: diff.metadata?.retryReason
              }
            }
          } else {
            // 重试失败，恢复为失败状态
            return {
              ...diff,
              status: 'failed' as const
            }
          }
        }
        return diff
      })
    )
  }, [])

  // 应用已接受的 diffs 到内容（这里返回修改后的内容）
  const applyAcceptedDiffs = useCallback((originalContent: string) => {
    const acceptedDiffs = getAcceptedDiffs()
    
    if (acceptedDiffs.length === 0) {
      return originalContent
    }

    let modifiedContent = originalContent
    const appliedDiffIds = new Set<string>()

    // 按照位置排序，从后往前应用（避免位置偏移）
    const sortedDiffs = [...acceptedDiffs].sort((a, b) => {
      // 简化的排序逻辑，实际应该基于文档位置
      return b.id.localeCompare(a.id)
    })

    for (const diff of sortedDiffs) {
      // 防止重复应用相同的 diff
      if (appliedDiffIds.has(diff.id)) {
        console.warn(`跳过重复应用 diff ${diff.id}`)
        continue
      }

      try {
        let applied = false
        
        switch (diff.type) {
          case 'insert':
            // 在指定位置插入内容
            if (diff.position?.anchor && diff.content?.new) {
              const anchorIndex = modifiedContent.indexOf(diff.position.anchor)
              if (anchorIndex !== -1) {
                const insertPosition = anchorIndex + diff.position.anchor.length
                modifiedContent = 
                  modifiedContent.slice(0, insertPosition) + 
                  '\n\n' + diff.content.new + '\n\n' +
                  modifiedContent.slice(insertPosition)
                applied = true
              }
            }
            break

          case 'delete':
            // 删除指定内容
            if (diff.content?.old) {
              const oldIndex = modifiedContent.indexOf(diff.content.old)
              if (oldIndex !== -1) {
                modifiedContent = modifiedContent.replace(diff.content.old, '')
                applied = true
              }
            }
            break

          case 'replace':
            // 替换指定内容
            if (diff.content?.old && diff.content?.new) {
              const oldIndex = modifiedContent.indexOf(diff.content.old)
              if (oldIndex !== -1) {
                modifiedContent = modifiedContent.replace(diff.content.old, diff.content.new)
                applied = true
              }
            }
            break

          case 'search_replace':
            // 处理 SEARCH/REPLACE 格式的 diff
            if (diff.diff) {
              const parsedDiff = parseSearchReplaceDiff(diff.diff)
              if (parsedDiff.searchContent && parsedDiff.replaceContent) {
                // 执行搜索替换
                const searchIndex = modifiedContent.indexOf(parsedDiff.searchContent)
                if (searchIndex !== -1) {
                  modifiedContent = 
                    modifiedContent.slice(0, searchIndex) + 
                    parsedDiff.replaceContent +
                    modifiedContent.slice(searchIndex + parsedDiff.searchContent.length)
                  applied = true
                  console.log(`✅ 应用 search_replace diff ${diff.id}`)
                } else {
                  console.warn(`❌ 未找到搜索内容，无法应用 diff ${diff.id}`)
                }
              }
            }
            break
        }
        
        if (applied) {
          appliedDiffIds.add(diff.id)
        }
      } catch (error) {
        console.warn(`应用 diff ${diff.id} 时出错:`, error)
      }
    }

    return modifiedContent
  }, [getAcceptedDiffs])

  return {
    diffs,
    addDiff,
    addDiffs,
    acceptDiff,
    rejectDiff,
    acceptAllDiffs,
    rejectAllDiffs,
    clearDiffs,
    clearProcessedDiffs,
    getStats,
    getPendingDiffs,
    getAcceptedDiffs,
    applyAcceptedDiffs,
    updateDiffStatus,
    retryDiff,
    completeRetry
  }
}