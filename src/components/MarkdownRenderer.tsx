'use client'

import { useRef, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { visit } from 'unist-util-visit'
import { DiffAction } from './DiffCard'

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

// 智能查找合适的插入位置
function findBestInsertPosition(content: string, anchorIndex: number, anchorLength: number): number {
  const afterAnchor = anchorIndex + anchorLength
  
  // 优先寻找段落结尾（双换行）
  const nextParagraphEnd = content.indexOf('\n\n', afterAnchor)
  if (nextParagraphEnd !== -1 && nextParagraphEnd < afterAnchor + 200) {
    return nextParagraphEnd
  }
  
  // 其次寻找句子结尾
  const sentenceEnds = ['. ', '。', '! ', '！', '? ', '？']
  let closestSentenceEnd = -1
  let closestDistance = Infinity
  
  for (const ending of sentenceEnds) {
    const pos = content.indexOf(ending, afterAnchor)
    if (pos !== -1 && pos < afterAnchor + 100) {
      const distance = pos - afterAnchor
      if (distance < closestDistance) {
        closestDistance = distance
        closestSentenceEnd = pos + ending.length
      }
    }
  }
  
  if (closestSentenceEnd !== -1) {
    return closestSentenceEnd
  }
  
  // 最后寻找行结尾
  const nextLineEnd = content.indexOf('\n', afterAnchor)
  if (nextLineEnd !== -1 && nextLineEnd < afterAnchor + 80) {
    return nextLineEnd
  }
  
  // 默认在 anchor 后插入
  return afterAnchor
}

// 模糊匹配锚点的函数
function findAnchorPosition(content: string, anchor: string): number {
  if (!anchor) return -1
  
  // 1. 精确匹配
  let position = content.indexOf(anchor)
  if (position !== -1) {
    console.log('🎯 精确匹配成功:', anchor.substring(0, 30) + '...')
    return position
  }
  
  // 2. 移除首尾空白和标点后匹配
  const cleanAnchor = anchor.replace(/^[\s\n\r]*/, '').replace(/[\s\n\r]*$/, '').trim()
  position = content.indexOf(cleanAnchor)
  if (position !== -1) {
    console.log('🎯 清理后匹配成功:', cleanAnchor.substring(0, 30) + '...')
    return position
  }
  
  // 3. 标准化空白字符后匹配（将多个空白字符替换为单个空格）
  const normalizedAnchor = cleanAnchor.replace(/\s+/g, ' ')
  const normalizedContent = content.replace(/\s+/g, ' ')
  position = normalizedContent.indexOf(normalizedAnchor)
  if (position !== -1) {
    // 需要将标准化后的位置映射回原始内容位置
    const beforeNormalized = normalizedContent.substring(0, position)
    const originalPosition = findOriginalPosition(content, beforeNormalized)
    console.log('🎯 标准化匹配成功:', normalizedAnchor.substring(0, 30) + '...')
    return originalPosition
  }
  
  // 4. 按句子分割，寻找相似度最高的句子
  const anchorSentences = cleanAnchor.split(/[。！？.!?]/).filter(s => s.trim().length > 5)
  const contentSentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 5)
  
  let bestMatch = -1
  let bestSimilarity = 0
  
  for (const anchorSent of anchorSentences) {
    for (let i = 0; i < contentSentences.length; i++) {
      const contentSent = contentSentences[i]
      const similarity = calculateTextSimilarity(anchorSent.trim(), contentSent.trim())
      
      if (similarity > 0.6 && similarity > bestSimilarity) {
        bestSimilarity = similarity
        bestMatch = content.indexOf(contentSent)
      }
    }
  }
  
  if (bestMatch !== -1) {
    console.log('🎯 模糊匹配成功，相似度:', bestSimilarity, '位置:', bestMatch)
    return bestMatch
  }
  
  // 5. 关键词匹配
  const anchorWords = cleanAnchor.match(/[\u4e00-\u9fa5a-zA-Z]{2,}/g) || []
  if (anchorWords.length > 0) {
    for (const word of anchorWords) {
      position = content.indexOf(word)
      if (position !== -1) {
        console.log('🎯 关键词匹配成功:', word, '位置:', position)
        return position
      }
    }
  }
  
  console.warn('❌ 锚点匹配失败:', anchor.substring(0, 50) + '...')
  return -1
}

// 辅助函数：将标准化后的位置映射回原始内容位置
function findOriginalPosition(originalContent: string, normalizedPrefix: string): number {
  let originalPos = 0
  let normalizedPos = 0
  
  while (originalPos < originalContent.length && normalizedPos < normalizedPrefix.length) {
    const originalChar = originalContent[originalPos]
    
    if (/\s/.test(originalChar)) {
      // 原始内容中的空白字符，跳过多个连续空白
      while (originalPos < originalContent.length && /\s/.test(originalContent[originalPos])) {
        originalPos++
      }
      // 标准化内容中对应一个空格
      if (normalizedPos < normalizedPrefix.length && normalizedPrefix[normalizedPos] === ' ') {
        normalizedPos++
      }
    } else {
      // 非空白字符，必须完全匹配
      if (originalChar === normalizedPrefix[normalizedPos]) {
        originalPos++
        normalizedPos++
      } else {
        break
      }
    }
  }
  
  return originalPos
}

// 计算文本相似度
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().match(/[\u4e00-\u9fa5a-zA-Z]+/g) || [])
  const words2 = new Set(text2.toLowerCase().match(/[\u4e00-\u9fa5a-zA-Z]+/g) || [])
  
  const intersection = new Set([...words1].filter(word => words2.has(word)))
  const union = new Set([...words1, ...words2])
  
  return union.size > 0 ? intersection.size / union.size : 0
}

// 应用 diffs 到内容的纯函数
function applyDiffsToContent(content: string, diffs: DiffAction[], currentDiffId?: string): string {
  console.log('🔧 开始应用 diffs:', diffs.length, '个', diffs.map(d => `${d.id}(${d.status})`))
  
  // 计算每个 diff 的位置并去重
  const diffPositions = diffs
    .map(diff => {
      // 对于 search_replace 类型，使用搜索内容作为锚点
      if (diff.type === 'search_replace' && diff.diff) {
        const parsedDiff = parseSearchReplaceDiff(diff.diff)
        console.log(`🔍 解析 search_replace diff ${diff.id}:`, {
          searchContent: parsedDiff.searchContent?.substring(0, 50) + '...',
          replaceContent: parsedDiff.replaceContent?.substring(0, 50) + '...'
        })
        if (parsedDiff.searchContent) {
          const anchorIndex = findAnchorPosition(content, parsedDiff.searchContent)
          return {
            diff,
            anchorIndex,
            anchorLength: parsedDiff.searchContent.length,
            anchor: parsedDiff.searchContent
          }
        }
      }
      
      // 对于传统格式，使用 position.anchor
      const anchor = diff.position?.anchor || ''
      const anchorIndex = findAnchorPosition(content, anchor)
      return {
        diff,
        anchorIndex,
        anchorLength: anchor.length,
        anchor
      }
    })
    .filter(dp => {
      if (dp.anchorIndex === -1) {
        console.warn('❌ 跳过无法定位的 diff:', dp.diff.id, '锚点:', dp.anchor?.substring(0, 30))
        return false
      }
      return true
    })
  
  // 按 anchor 去重（相同 anchor 只保留第一个）
  const uniquePositions = diffPositions.filter((dp, index) => {
    return !diffPositions.slice(0, index).some(
      prevDp => prevDp.anchor === dp.anchor
    )
  })
  
  // 按位置从后往前排序
  const sortedPositions = uniquePositions.sort((a, b) => b.anchorIndex - a.anchorIndex)
  
  let processedContent = content
  
  // 应用每个 diff
  for (const { diff, anchorIndex, anchorLength } of sortedPositions) {
    const diffId = diff.id
    const isCurrentDiff = diffId === currentDiffId
    const statusClass = diff.status === 'accepted' ? 'accepted' : 'pending'
    
    try {
      switch (diff.type) {
        case 'insert': {
          const insertPosition = findBestInsertPosition(processedContent, anchorIndex, anchorLength)
          const insertHtml = `\n\n<span class="diff-insert ${statusClass} ${isCurrentDiff ? 'current' : ''}" data-diff-id="${diffId}" data-diff-type="insert">${diff.content?.new || ''}</span>\n\n`
          
          processedContent = 
            processedContent.slice(0, insertPosition) + 
            insertHtml +
            processedContent.slice(insertPosition)
          break
        }

        case 'delete': {
          if (!diff.content?.old) break
          const deleteHtml = `<span class="diff-delete ${statusClass} ${isCurrentDiff ? 'current' : ''}" data-diff-id="${diffId}" data-diff-type="delete">${diff.content.old}</span>`
          
          const matchIndex = processedContent.indexOf(diff.content.old)
          if (matchIndex !== -1) {
            processedContent = 
              processedContent.slice(0, matchIndex) + 
              deleteHtml + 
              processedContent.slice(matchIndex + diff.content.old.length)
          }
          break
        }

        case 'replace': {
          if (!diff.content?.old) break
          const replaceHtml = `<span class="diff-delete ${statusClass}" data-diff-id="${diffId}" data-diff-type="delete">${diff.content.old}</span><span class="diff-insert ${statusClass} ${isCurrentDiff ? 'current' : ''}" data-diff-id="${diffId}" data-diff-type="insert">${diff.content?.new || ''}</span>`
          
          const matchIndex = processedContent.indexOf(diff.content.old)
          if (matchIndex !== -1) {
            processedContent = 
              processedContent.slice(0, matchIndex) + 
              replaceHtml + 
              processedContent.slice(matchIndex + diff.content.old.length)
          }
          break
        }

        case 'search_replace': {
          if (!diff.diff) break
          const parsedDiff = parseSearchReplaceDiff(diff.diff)
          if (!parsedDiff.searchContent || !parsedDiff.replaceContent) break
          
          const replaceHtml = `<span class="diff-delete ${statusClass}" data-diff-id="${diffId}" data-diff-type="delete">${parsedDiff.searchContent}</span><span class="diff-insert ${statusClass} ${isCurrentDiff ? 'current' : ''}" data-diff-id="${diffId}" data-diff-type="insert">${parsedDiff.replaceContent}</span>`
          
          const matchIndex = processedContent.indexOf(parsedDiff.searchContent)
          if (matchIndex !== -1) {
            processedContent = 
              processedContent.slice(0, matchIndex) + 
              replaceHtml + 
              processedContent.slice(matchIndex + parsedDiff.searchContent.length)
          }
          break
        }
      }
    } catch (error) {
      console.warn(`Failed to apply diff ${diffId}:`, error)
      // 继续处理其他 diffs
    }
  }
  
  return processedContent
}

interface MarkdownRendererProps {
  content: string
  onDoubleClick?: (position: { x: number; y: number }) => void
  diffs?: DiffAction[]
  currentDiffId?: string
  onDiffClick?: (diffId: string) => void
  onAcceptDiff?: (diffId: string) => void
  onRejectDiff?: (diffId: string) => void
}

export default function MarkdownRenderer({ 
  content, 
  onDoubleClick, 
  diffs = [],
  currentDiffId,
  onDiffClick,
  onAcceptDiff,
  onRejectDiff 
}: MarkdownRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // 预处理内容，插入 diff 标记
  const contentWithDiffs = useMemo(() => {
    if (!diffs.length) return content
    
    const activeDiffs = diffs.filter(d => d.status === 'pending' || d.status === 'accepted')
    if (!activeDiffs.length) return content
    
    try {
      return applyDiffsToContent(content, activeDiffs, currentDiffId)
    } catch (error) {
      console.error('Failed to apply diffs to content:', error)
      return content // 出错时返回原内容
    }
  }, [content, diffs, currentDiffId])

  // 处理双击事件
  const handleDoubleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const diffElement = target.closest('[data-diff-id]') as HTMLElement
    
    // 如果双击的是 diff 元素，执行接受操作
    if (diffElement && onAcceptDiff) {
      const diffId = diffElement.getAttribute('data-diff-id')
      if (diffId) {
        e.preventDefault()
        e.stopPropagation()
        onAcceptDiff(diffId)
        return
      }
    }
    
    // 否则执行原有的双击逻辑
    if (!onDoubleClick) return
    const clickX = e.clientX
    const clickY = e.clientY
    onDoubleClick({ x: clickX, y: clickY })
  }

  // 处理点击事件
  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const diffElement = target.closest('[data-diff-id]') as HTMLElement
    
    if (diffElement && onDiffClick) {
      const diffId = diffElement.getAttribute('data-diff-id')
      if (diffId) {
        e.preventDefault()
        e.stopPropagation()
        onDiffClick(diffId)
      }
    }
  }

  // 处理右键事件
  const handleContextMenu = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const diffElement = target.closest('[data-diff-id]') as HTMLElement
    
    if (diffElement && onRejectDiff) {
      const diffId = diffElement.getAttribute('data-diff-id')
      if (diffId) {
        e.preventDefault()
        e.stopPropagation()
        onRejectDiff(diffId)
      }
    }
  }

  return (
    <>
      <div 
        ref={containerRef}
        className="markdown-content prose prose-sm max-w-none cursor-text relative"
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        title=""
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw, rehypeHighlight]}
        >
          {contentWithDiffs}
        </ReactMarkdown>
      </div>
    </>
  )
}