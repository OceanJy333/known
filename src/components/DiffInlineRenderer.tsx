'use client'

import { useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { visit } from 'unist-util-visit'
import { DiffAction } from './DiffCard'

interface DiffInlineRendererProps {
  content: string
  diffs: DiffAction[]
  currentDiffId?: string
  onDiffClick?: (diffId: string) => void
  onDoubleClick?: (clickPosition: { x: number; y: number }) => void
}

export default function DiffInlineRenderer({ 
  content, 
  diffs, 
  currentDiffId,
  onDiffClick,
  onDoubleClick 
}: DiffInlineRendererProps) {
  
  // 创建自定义 rehype 插件处理 diff 标记
  const rehypeDiffProcessor = () => {
    return (tree: any) => {
      visit(tree, 'text', (node, index, parent) => {
        if (!parent || typeof node.value !== 'string') return
        
        const text = node.value
        const diffRegex = /\*\*\[DIFF_ADD_([^_]+)_([^_]+)_([^\]]+)\](.*?)\[\/DIFF_ADD\]\*\*|~~\[DIFF_DEL_([^_]+)_([^_]+)_([^\]]+)\](.*?)\[\/DIFF_DEL\]~~/g
        
        let lastIndex = 0
        const newNodes: any[] = []
        let match
        
        while ((match = diffRegex.exec(text)) !== null) {
          // 添加匹配前的文本
          if (match.index > lastIndex) {
            newNodes.push({
              type: 'text',
              value: text.slice(lastIndex, match.index)
            })
          }
          
          // 解析 diff 标记
          const isAdd = match[0].startsWith('**')
          const diffId = isAdd ? match[1] : match[5]
          const statusClass = isAdd ? match[2] : match[6]
          const currentClass = isAdd ? match[3] : match[7]
          const diffText = isAdd ? match[4] : match[8]
          
          // 创建 diff 元素
          newNodes.push({
            type: 'element',
            tagName: 'span',
            properties: {
              className: [
                isAdd ? 'diff-added' : 'diff-deleted',
                statusClass,
                currentClass === 'current' ? 'current' : ''
              ].filter(Boolean),
              'data-diff-id': diffId
            },
            children: [{ type: 'text', value: diffText }]
          })
          
          lastIndex = match.index + match[0].length
        }
        
        // 添加剩余文本
        if (lastIndex < text.length) {
          newNodes.push({
            type: 'text',
            value: text.slice(lastIndex)
          })
        }
        
        // 如果有 diff 标记，替换当前节点
        if (newNodes.length > 1 || (newNodes.length === 1 && newNodes[0].type !== 'text')) {
          parent.children.splice(index, 1, ...newNodes)
        }
      })
    }
  }
  
  // 将 diff 应用到内容中，生成带有内联 diff 标记的内容
  const contentWithInlineDiffs = useMemo(() => {
    if (diffs.length === 0) return content
    
    let modifiedContent = content
    const activeDiffs = diffs.filter(d => d.status === 'pending' || d.status === 'accepted')
    
    // 按位置排序，从后往前应用以避免位置偏移
    const sortedDiffs = [...activeDiffs].sort((a, b) => {
      const getPriority = (diff: DiffAction) => {
        if (diff.position?.anchor) {
          const index = content.indexOf(diff.position.anchor)
          return index !== -1 ? index : Infinity
        }
        return Infinity
      }
      return getPriority(b) - getPriority(a) // 从后往前
    })
    
    sortedDiffs.forEach(diff => {
      const diffId = diff.id
      const isCurrentDiff = diffId === currentDiffId
      const statusClass = diff.status === 'accepted' ? 'accepted' : 'pending'
      
      try {
        switch (diff.type) {
          case 'insert':
            if (diff.position?.anchor) {
              const anchorIndex = modifiedContent.indexOf(diff.position.anchor)
              if (anchorIndex !== -1) {
                const insertPosition = anchorIndex + diff.position.anchor.length
                const insertHtml = `**[DIFF_ADD_${diffId}_${statusClass}_${isCurrentDiff ? 'current' : 'normal'}]${diff.content?.new}[/DIFF_ADD]**`
                
                modifiedContent = 
                  modifiedContent.slice(0, insertPosition) + 
                  insertHtml +
                  modifiedContent.slice(insertPosition)
              }
            }
            break

          case 'delete':
            if (diff.content?.old) {
              const deleteHtml = `~~[DIFF_DEL_${diffId}_${statusClass}_${isCurrentDiff ? 'current' : 'normal'}]${diff.content.old}[/DIFF_DEL]~~`
              modifiedContent = modifiedContent.replace(diff.content.old, deleteHtml)
            }
            break

          case 'replace':
            if (diff.content?.old) {
              // 替换 = 删除旧的 + 新增新的
              const replaceHtml = `~~[DIFF_DEL_${diffId}_${statusClass}_normal]${diff.content.old}[/DIFF_DEL]~~~~[DIFF_ADD_${diffId}_${statusClass}_${isCurrentDiff ? 'current' : 'normal'}]${diff.content?.new}[/DIFF_ADD]~~`
              modifiedContent = modifiedContent.replace(diff.content.old, replaceHtml)
            }
            break
        }
      } catch (error) {
        console.warn(`应用 diff ${diffId} 时出错:`, error)
      }
    })
    
    return modifiedContent
  }, [content, diffs, currentDiffId])

  // 处理点击事件
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const diffElement = target.closest('[data-diff-id]') as HTMLElement
    
    if (diffElement) {
      const diffId = diffElement.getAttribute('data-diff-id')
      if (diffId) {
        e.preventDefault()
        onDiffClick?.(diffId)
      }
    }
  }

  // 处理双击事件
  const handleDoubleClick = (e: React.MouseEvent) => {
    // 只有在非 diff 元素上双击时才触发助手
    const target = e.target as HTMLElement
    const diffElement = target.closest('[data-diff-id]')
    
    if (!diffElement && onDoubleClick) {
      onDoubleClick({ x: e.clientX, y: e.clientY })
    }
  }

  return (
    <div 
      className="diff-inline-renderer"
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight, rehypeDiffProcessor]}
      >
        {contentWithInlineDiffs}
      </ReactMarkdown>
    </div>
  )
}