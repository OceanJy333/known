export interface SearchReplaceBlock {
  searchContent: string
  replaceContent: string
  blockIndex: number
  confidence?: number // 匹配置信度
  matchType?: 'exact' | 'line_trimmed' | 'block_anchor' // 匹配类型
  warnings?: string[] // 警告信息
}

export interface ParseResult {
  success: boolean
  blocks: SearchReplaceBlock[]
  errors: string[]
  warnings: string[]
  stats: {
    totalBlocks: number
    validBlocks: number
    incompleteBlocks: number
  }
}

// 支持多种SEARCH/REPLACE格式的正则表达式
const SEARCH_BLOCK_PATTERNS = [
  /^[-]{3,}\s*SEARCH>?\s*$/i,        // --- SEARCH
  /^[<]{3,}\s*SEARCH>?\s*$/i,        // <<< SEARCH
  /^\[SEARCH\]\s*$/i,               // [SEARCH]
  /^SEARCH:?\s*$/i                  // SEARCH:
]

const SEPARATOR_PATTERNS = [
  /^[=]{3,}\s*$/,                   // =======
  /^[-]{3,}\s*$/,                   // -------  
  /^[~]{3,}\s*$/                    // ~~~~~~~
]

const REPLACE_BLOCK_PATTERNS = [
  /^[+]{3,}\s*REPLACE>?\s*$/i,       // +++ REPLACE
  /^[>]{3,}\s*REPLACE>?\s*$/i,       // >>> REPLACE
  /^\[REPLACE\]\s*$/i,              // [REPLACE]
  /^REPLACE:?\s*$/i                 // REPLACE:
]

enum ProcessingState {
  IDLE = 'idle',
  SEARCHING_FOR_SEARCH = 'searching_for_search',
  IN_SEARCH_BLOCK = 'in_search_block',
  SEARCHING_FOR_SEPARATOR = 'searching_for_separator', 
  IN_REPLACE_BLOCK = 'in_replace_block',
  SEARCHING_FOR_REPLACE_END = 'searching_for_replace_end'
}

export function parseSearchReplaceBlocks(diffContent: string): ParseResult {
  const blocks: SearchReplaceBlock[] = []
  const errors: string[] = []
  const warnings: string[] = []
  const lines = diffContent.split('\n')
  
  let currentBlock: Partial<SearchReplaceBlock> = {}
  let state = ProcessingState.IDLE
  let searchLines: string[] = []
  let replaceLines: string[] = []
  let blockIndex = 0
  let currentLineNumber = 0
  
  // 统计信息
  let totalBlocks = 0
  let validBlocks = 0
  let incompleteBlocks = 0
  
  for (let i = 0; i < lines.length; i++) {
    currentLineNumber = i + 1
    const line = lines[i]
    const trimmedLine = line.trim()
    
    // 检测SEARCH块开始
    if (isSearchBlockStart(trimmedLine)) {
      if (state !== ProcessingState.IDLE) {
        incompleteBlocks++
        errors.push(`第 ${currentLineNumber} 行: 检测到未完成的SEARCH/REPLACE块，自动恢复处理`)
        // 尝试恢复：保存当前不完整的块
        if (searchLines.length > 0) {
          warnings.push(`保存不完整的SEARCH块 (${searchLines.length} 行)`)
        }
      }
      
      totalBlocks++
      state = ProcessingState.IN_SEARCH_BLOCK
      searchLines = []
      replaceLines = []
      currentBlock = { blockIndex: blockIndex++ }
      continue
    }
    
    // 检测分隔符
    if (isSeparatorLine(trimmedLine)) {
      if (state === ProcessingState.IN_SEARCH_BLOCK) {
        if (searchLines.length === 0) {
          errors.push(`第 ${currentLineNumber} 行: SEARCH块为空`)
          continue
        }
        state = ProcessingState.IN_REPLACE_BLOCK
        currentBlock.searchContent = searchLines.join('\n')
        continue
      } else if (state !== ProcessingState.IDLE) {
        warnings.push(`第 ${currentLineNumber} 行: 意外的分隔符，尝试继续处理`)
      }
      continue
    }
    
    // 检测REPLACE块结束
    if (isReplaceBlockEnd(trimmedLine)) {
      if (state === ProcessingState.IN_REPLACE_BLOCK) {
        currentBlock.replaceContent = replaceLines.join('\n')
        
        // 验证块的完整性
        if (validateBlock(currentBlock as SearchReplaceBlock)) {
          blocks.push(currentBlock as SearchReplaceBlock)
          validBlocks++
        } else {
          errors.push(`第 ${currentLineNumber} 行: 块验证失败`)
          incompleteBlocks++
        }
        
        currentBlock = {}
        state = ProcessingState.IDLE
        continue
      } else {
        warnings.push(`第 ${currentLineNumber} 行: 意外的REPLACE结束标记`)
      }
      continue
    }
    
    // 累积内容行
    if (state === ProcessingState.IN_SEARCH_BLOCK) {
      searchLines.push(line)
    } else if (state === ProcessingState.IN_REPLACE_BLOCK) {
      replaceLines.push(line)
    }
    // 忽略IDLE状态下的非标记行
  }
  
  // 处理文件结尾的未完成块
  if (state !== ProcessingState.IDLE) {
    incompleteBlocks++
    if (state === ProcessingState.IN_SEARCH_BLOCK && searchLines.length > 0) {
      warnings.push(`文件结尾检测到未完成的SEARCH块，包含 ${searchLines.length} 行内容`)
    } else if (state === ProcessingState.IN_REPLACE_BLOCK) {
      warnings.push('文件结尾检测到未完成的REPLACE块，缺少结束标记')
      // 尝试恢复：假设文件结尾就是REPLACE结束
      if (currentBlock.searchContent) {
        currentBlock.replaceContent = replaceLines.join('\n')
        if (validateBlock(currentBlock as SearchReplaceBlock)) {
          blocks.push(currentBlock as SearchReplaceBlock)
          validBlocks++
          warnings.push('已自动恢复文件结尾的REPLACE块')
        }
      }
    }
  }
  
  return {
    success: errors.length === 0,
    blocks,
    errors,
    warnings,
    stats: {
      totalBlocks,
      validBlocks, 
      incompleteBlocks
    }
  }
}

// 检测SEARCH块开始的多种格式
function isSearchBlockStart(line: string): boolean {
  return SEARCH_BLOCK_PATTERNS.some(pattern => pattern.test(line))
}

// 检测分隔符行
function isSeparatorLine(line: string): boolean {
  return SEPARATOR_PATTERNS.some(pattern => pattern.test(line))
}

// 检测REPLACE块结束
function isReplaceBlockEnd(line: string): boolean {
  return REPLACE_BLOCK_PATTERNS.some(pattern => pattern.test(line))
}

// 验证块的有效性
function validateBlock(block: SearchReplaceBlock): boolean {
  if (!block.searchContent || block.searchContent.trim() === '') {
    return false
  }
  
  // REPLACE内容可以为空（删除操作）
  if (block.replaceContent === undefined) {
    return false
  }
  
  // 检查是否为无意义的替换
  if (block.searchContent === block.replaceContent) {
    return false
  }
  
  return true
}

export interface ApplyResult {
  success: boolean
  content: string
  appliedBlocks: number
  errors: string[]
  warnings: string[]
  appliedDetails?: any[]
}

export function applySearchReplaceBlocks(
  originalContent: string, 
  blocks: SearchReplaceBlock[]
): ApplyResult {
  let modifiedContent = originalContent
  let appliedBlocks = 0
  const errors: string[] = []
  const warnings: string[] = []
  const appliedDetails: ApplyResult['appliedDetails'] = []
  let lastProcessedIndex = 0 // 跟踪已处理的位置，类似 Cline
  
  // 按顺序处理每个块（不重新排序，保持原始顺序）
  for (const block of blocks) {
    const result = applySearchReplaceBlockEnhanced(modifiedContent, block, lastProcessedIndex)
    
    if (result.success && 'content' in result && result.content) {
      modifiedContent = result.content
      appliedBlocks++
      
      appliedDetails.push({
        blockIndex: block.blockIndex,
        matchType: result.matchType!,
        confidence: result.confidence!,
        originalStart: result.start!,
        originalEnd: result.end!
      })
      
      // 更新已处理位置
      lastProcessedIndex = result.end!
      
      if (result.matchType !== 'exact') {
        warnings.push(`Block ${block.blockIndex}: 使用${result.matchType}匹配，置信度: ${result.confidence}`)
      }
    } else {
      errors.push(`Block ${block.blockIndex}: ${result.error}`)
    }
  }
  
  return {
    success: errors.length === 0,
    content: modifiedContent,
    appliedBlocks,
    errors,
    warnings,
    appliedDetails
  }
}

// 增强版本的单块应用函数（参考 Cline 实现）
function applySearchReplaceBlockEnhanced(content: string, block: SearchReplaceBlock, startIndex: number = 0) {
  // 1. 精确匹配
  const exactResult = tryExactMatch(content, block, startIndex)
  if (exactResult.success) {
    return { ...exactResult, matchType: 'exact', confidence: 1.0 }
  }
  
  // 2. 行级修剪匹配
  const lineTrimmedResult = tryLineTrimmedMatch(content, block, startIndex)
  if (lineTrimmedResult.success) {
    return { ...lineTrimmedResult, matchType: 'line_trimmed', confidence: 0.8 }
  }
  
  // 3. 块锚点匹配（仅3+行的块）
  if (block.searchContent.split('\n').length >= 3) {
    const blockAnchorResult = tryBlockAnchorMatch(content, block, startIndex)
    if (blockAnchorResult.success) {
      return { ...blockAnchorResult, matchType: 'block_anchor', confidence: 0.6 }
    }
  }
  
  return {
    success: false,
    error: `所有匹配策略都失败: "${block.searchContent.substring(0, 50)}..."`
  }
}

// 精确匹配
function tryExactMatch(content: string, block: SearchReplaceBlock, startIndex: number = 0) {
  const index = content.indexOf(block.searchContent, startIndex)
  
  if (index === -1) {
    return { success: false, error: '精确匹配失败' }
  }
  
  const newContent = 
    content.slice(0, index) + 
    block.replaceContent + 
    content.slice(index + block.searchContent.length)
  
  return {
    success: true,
    content: newContent,
    start: index,
    end: index + block.searchContent.length
  }
}

// 实现类似 Cline 的三级匹配策略
function applyWithFallbackMatching(content: string, block: SearchReplaceBlock) {
  // 1. 精确匹配（已在主函数中尝试）
  
  // 2. 行级修剪匹配
  const lineTrimmedMatch = findLineTrimmedMatch(content, block.searchContent)
  if (lineTrimmedMatch) {
    return {
      success: true,
      content: content.slice(0, lineTrimmedMatch.start) + 
               block.replaceContent + 
               content.slice(lineTrimmedMatch.end)
    }
  }
  
  // 3. 块锚点匹配（对于3+行的块）
  if (block.searchContent.split('\n').length >= 3) {
    const blockAnchorMatch = findBlockAnchorMatch(content, block.searchContent)
    if (blockAnchorMatch) {
      return {
        success: true,
        content: content.slice(0, blockAnchorMatch.start) + 
                 block.replaceContent + 
                 content.slice(blockAnchorMatch.end)
      }
    }
  }
  
  return {
    success: false,
    error: `所有匹配策略都失败了: "${block.searchContent.substring(0, 50)}..."`
  }
}

// 行级修剪匹配（去除前导/尾随空白）
function findLineTrimmedMatch(content: string, searchContent: string) {
  const contentLines = content.split('\n')
  const searchLines = searchContent.split('\n')
  
  for (let i = 0; i <= contentLines.length - searchLines.length; i++) {
    let matches = true
    
    for (let j = 0; j < searchLines.length; j++) {
      if (contentLines[i + j].trim() !== searchLines[j].trim()) {
        matches = false
        break
      }
    }
    
    if (matches) {
      // 计算确切的字符位置
      let start = 0
      for (let k = 0; k < i; k++) {
        start += contentLines[k].length + 1
      }
      
      let end = start
      for (let k = 0; k < searchLines.length; k++) {
        end += contentLines[i + k].length + 1
      }
      
      return { start, end }
    }
  }
  
  return null
}

// ========== 新增的增强匹配函数 ==========

// 行级修剪匹配（去除前导/尾随空白） - 增强版
function tryLineTrimmedMatch(content: string, block: SearchReplaceBlock, startIndex: number = 0) {
  const match = findLineTrimmedMatchEnhanced(content, block.searchContent, startIndex)
  if (!match) {
    return { success: false, error: '行级修剪匹配失败' }
  }
  
  const newContent = 
    content.slice(0, match.start) + 
    block.replaceContent + 
    content.slice(match.end)
  
  return {
    success: true,
    content: newContent,
    start: match.start,
    end: match.end,
    matchType: 'line_trimmed',
    confidence: 0.8
  }
}

// 块锚点匹配（使用首末行作为锚点）
function tryBlockAnchorMatch(content: string, block: SearchReplaceBlock, startIndex: number = 0) {
  const match = findBlockAnchorMatchEnhanced(content, block.searchContent, startIndex)
  if (!match) {
    return { success: false, error: '块锚点匹配失败' }
  }
  
  const newContent = 
    content.slice(0, match.start) + 
    block.replaceContent + 
    content.slice(match.end)
  
  return {
    success: true,
    content: newContent,
    start: match.start,
    end: match.end
  }
}

// 模糊匹配（基于相似度的匹配）
function tryFuzzyMatch(content: string, block: SearchReplaceBlock) {
  const searchLines = block.searchContent.split('\n')
  const contentLines = content.split('\n')
  
  let bestMatch: { start: number; end: number; similarity: number } | null = null
  
  // 对于较长的块，尝试找到最相似的区域
  for (let i = 0; i <= contentLines.length - searchLines.length; i++) {
    const windowLines = contentLines.slice(i, i + searchLines.length)
    const similarity = calculateSimilarity(searchLines, windowLines)
    
    if (similarity > 0.7 && (!bestMatch || similarity > bestMatch.similarity)) {
      let start = 0
      for (let k = 0; k < i; k++) {
        start += contentLines[k].length + 1
      }
      
      let end = start
      for (let k = 0; k < searchLines.length; k++) {
        end += contentLines[i + k].length + 1
      }
      
      bestMatch = { start, end, similarity }
    }
  }
  
  if (!bestMatch) {
    return { success: false, error: '模糊匹配失败，相似度过低' }
  }
  
  const newContent = 
    content.slice(0, bestMatch.start) + 
    block.replaceContent + 
    content.slice(bestMatch.end)
  
  return {
    success: true,
    content: newContent,
    start: bestMatch.start,
    end: bestMatch.end
  }
}

// 增强的行级修剪匹配（参考 Cline 实现）
function findLineTrimmedMatchEnhanced(content: string, searchContent: string, startIndex: number = 0) {
  const contentLines = content.split('\n')
  const searchLines = searchContent.split('\n')
  
  // 移除搜索内容末尾的空行（由于 \n 造成的）
  if (searchLines.length > 0 && searchLines[searchLines.length - 1] === '') {
    searchLines.pop()
  }
  
  // 对于空搜索内容，直接返回失败
  if (searchLines.length === 0 || searchLines.every(line => line.trim() === '')) {
    return null
  }
  
  // 找到 startIndex 对应的行号
  let startLineNum = 0
  let currentIndex = 0
  while (currentIndex < startIndex && startLineNum < contentLines.length) {
    currentIndex += contentLines[startLineNum].length + 1 // +1 for \n
    startLineNum++
  }

  // 从 startIndex 对应的行开始遍历
  for (let i = startLineNum; i <= contentLines.length - searchLines.length; i++) {
    let matches = true
    
    // 尝试匹配所有搜索行
    for (let j = 0; j < searchLines.length; j++) {
      const contentLineTrimmed = contentLines[i + j].trim()
      const searchLineTrimmed = searchLines[j].trim()
      
      if (contentLineTrimmed !== searchLineTrimmed) {
        matches = false
        break
      }
    }
    
    // 如果找到匹配，计算确切的字符位置
    if (matches) {
      // 计算起始字符索引
      let matchStartIndex = 0
      for (let k = 0; k < i; k++) {
        matchStartIndex += contentLines[k].length + 1 // +1 for \n
      }
      
      // 计算结束字符索引
      let matchEndIndex = matchStartIndex
      for (let k = 0; k < searchLines.length; k++) {
        matchEndIndex += contentLines[i + k].length + 1 // +1 for \n
      }
      
      return { start: matchStartIndex, end: matchEndIndex }
    }
  }
  
  return null
}

// 增强的块锚点匹配（参考 Cline 实现）
function findBlockAnchorMatchEnhanced(content: string, searchContent: string, startIndex: number = 0) {
  const contentLines = content.split('\n')
  const searchLines = searchContent.split('\n')
  
  // 移除搜索内容末尾的空行
  if (searchLines.length > 0 && searchLines[searchLines.length - 1] === '') {
    searchLines.pop()
  }
  
  // 仅对 3+ 行的块使用此方法，避免误匹配
  if (searchLines.length < 3) return null
  
  const firstLineSearch = searchLines[0].trim()
  const lastLineSearch = searchLines[searchLines.length - 1].trim()
  const blockSize = searchLines.length
  
  // 如果首末行都是空的，不使用此策略
  if (firstLineSearch === '' || lastLineSearch === '') {
    return null
  }
  
  // 找到 startIndex 对应的行号
  let startLineNum = 0
  let currentIndex = 0
  while (currentIndex < startIndex && startLineNum < contentLines.length) {
    currentIndex += contentLines[startLineNum].length + 1 // +1 for \n
    startLineNum++
  }

  // 从 startIndex 对应的行开始遍历内容，寻找匹配的首末行组合
  for (let i = startLineNum; i <= contentLines.length - blockSize; i++) {
    // 检查首行是否匹配
    const contentFirstLine = contentLines[i].trim()
    const contentLastLine = contentLines[i + blockSize - 1].trim()
    
    if (contentFirstLine === firstLineSearch && contentLastLine === lastLineSearch) {
      // 找到潜在匹配，现在验证整个块的相似度
      let matchingLines = 0
      let totalComparableLines = 0
      
      for (let j = 0; j < blockSize; j++) {
        const searchLine = searchLines[j].trim()
        const contentLine = contentLines[i + j]?.trim()
        
        // 只对非空行进行比较
        if (searchLine !== '') {
          totalComparableLines++
          if (searchLine === contentLine) {
            matchingLines++
          }
        }
      }
      
      // 需要至少 60% 的行匹配
      const similarity = totalComparableLines > 0 ? matchingLines / totalComparableLines : 0
      if (similarity >= 0.6) {
        // 计算字符位置
        let matchStartIndex = 0
        for (let k = 0; k < i; k++) {
          matchStartIndex += contentLines[k].length + 1 // +1 for \n
        }
        
        let matchEndIndex = matchStartIndex
        for (let k = 0; k < blockSize; k++) {
          matchEndIndex += contentLines[i + k].length + 1 // +1 for \n
        }
        
        return { start: matchStartIndex, end: matchEndIndex }
      }
    }
  }
  
  return null
}

// 计算两个行数组的相似度
function calculateSimilarity(lines1: string[], lines2: string[]): number {
  if (lines1.length !== lines2.length) return 0
  
  let matches = 0
  for (let i = 0; i < lines1.length; i++) {
    const line1 = lines1[i].trim()
    const line2 = lines2[i].trim()
    
    if (line1 === line2) {
      matches++
    } else {
      // 计算字符级相似度
      const charSimilarity = calculateLevenshteinSimilarity(line1, line2)
      if (charSimilarity > 0.8) {
        matches += charSimilarity
      }
    }
  }
  
  return matches / lines1.length
}

// 简化的Levenshtein相似度计算
function calculateLevenshteinSimilarity(str1: string, str2: string): number {
  const maxLength = Math.max(str1.length, str2.length)
  if (maxLength === 0) return 1
  
  const distance = levenshteinDistance(str1, str2)
  return 1 - distance / maxLength
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null))
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + substitutionCost // substitution
      )
    }
  }
  
  return matrix[str2.length][str1.length]
}

// ========== 错误诊断和修复建议 ==========

export interface DiagnosticResult {
  blockIndex: number
  errorType: 'not_found' | 'format_error' | 'similarity_low' | 'ambiguous_match'
  severity: 'error' | 'warning' | 'info'
  message: string
  suggestions: string[]
  bestMatches?: {
    content: string
    similarity: number
    position: number
  }[]
}

// 对失败的块进行诊断并提供修复建议
export function diagnoseFailedBlock(
  content: string, 
  block: SearchReplaceBlock
): DiagnosticResult {
  const searchLines = block.searchContent.split('\n')
  
  // 1. 检查是否为格式问题
  if (block.searchContent.trim() === '') {
    return {
      blockIndex: block.blockIndex,
      errorType: 'format_error',
      severity: 'error',
      message: '搜索内容为空',
      suggestions: [
        '确保SEARCH块包含要查找的实际内容',
        '检查SEARCH/REPLACE块的格式是否正确'
      ]
    }
  }
  
  // 2. 查找相似内容
  const bestMatches = findBestMatches(content, block.searchContent, 3)
  
  if (!bestMatches || bestMatches.length === 0) {
    return {
      blockIndex: block.blockIndex,
      errorType: 'not_found',
      severity: 'error',
      message: '在文档中找不到匹配的内容',
      suggestions: [
        '检查搜索内容是否与文档中的实际文本完全一致',
        '确认文档内容是否已被修改',
        '尝试使用更具体的搜索字符串',
        '检查空白字符、缩进和特殊字符是否正确'
      ],
      bestMatches
    }
  }
  
  const topMatch = bestMatches[0]
  
  // 3. 相似度较高但不完全匹配
  if (topMatch && topMatch.similarity > 0.7) {
    return {
      blockIndex: block.blockIndex,
      errorType: 'similarity_low',
      severity: 'warning',
      message: `找到相似内容但不完全匹配 (相似度: ${(topMatch.similarity * 100).toFixed(1)}%)`,
      suggestions: [
        '检查空白字符、换行符和缩进是否完全一致',
        '确认是否有隐藏字符或特殊编码',
        '考虑使用行级修剪匹配或块锚点匹配',
        `建议的搜索内容: "${topMatch.content.substring(0, 100)}..."`
      ],
      bestMatches
    }
  }
  
  // 4. 找到多个类似匹配（模糊匹配）
  if (bestMatches && bestMatches.length > 1 && bestMatches[1].similarity > 0.5) {
    return {
      blockIndex: block.blockIndex,
      errorType: 'ambiguous_match',
      severity: 'warning',
      message: '找到多个可能的匹配位置',
      suggestions: [
        '增加更多上下文以确保唯一性',
        '使用更具体的搜索字符串',
        '检查是否有重复的代码段',
        `最佳匹配位置: 第${getLineNumber(content, topMatch.position)}行`
      ],
      bestMatches
    }
  }
  
  // 5. 相似度过低
  return {
    blockIndex: block.blockIndex,
    errorType: 'not_found',
    severity: 'error',
    message: '找不到足够相似的内容',
    suggestions: [
      '确认搜索内容是否来自当前文档',
      '检查文档是否已被其他diff修改',
      '尝试搜索部分关键词',
      '考虑重新生成diff'
    ],
    bestMatches
  }
}

// 查找最佳匹配
function findBestMatches(
  content: string, 
  searchContent: string, 
  maxResults: number = 3
): NonNullable<DiagnosticResult['bestMatches']> {
  const searchLines = searchContent.split('\n')
  const contentLines = content.split('\n')
  const matches: DiagnosticResult['bestMatches'] = []
  
  // 滑动窗口查找
  for (let i = 0; i <= contentLines.length - searchLines.length; i++) {
    const windowLines = contentLines.slice(i, i + searchLines.length)
    const windowContent = windowLines.join('\n')
    const similarity = calculateSimilarity(searchLines, windowLines)
    
    if (similarity > 0.3) { // 至少30%相似度才考虑
      let position = 0
      for (let k = 0; k < i; k++) {
        position += contentLines[k].length + 1
      }
      
      matches.push({
        content: windowContent,
        similarity,
        position
      })
    }
  }
  
  // 按相似度排序并返回前N个
  return matches
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, maxResults)
}

// 获取字符位置对应的行号
function getLineNumber(content: string, position: number): number {
  const beforePosition = content.substring(0, position)
  return beforePosition.split('\n').length
}

// 批量诊断所有失败的块
export function diagnoseFailedBlocks(
  content: string, 
  blocks: SearchReplaceBlock[]
): DiagnosticResult[] {
  const diagnostics: DiagnosticResult[] = []
  
  for (const block of blocks) {
    // 尝试应用单个块来检测失败
    const result = tryExactMatch(content, block)
    if (!result.success) {
      const diagnostic = diagnoseFailedBlock(content, block)
      diagnostics.push(diagnostic)
    }
  }
  
  return diagnostics
}

// ========== 流式解析支持 ==========

export interface StreamingParseState {
  currentBlock: Partial<SearchReplaceBlock>
  state: ProcessingState
  searchLines: string[]
  replaceLines: string[]
  blockIndex: number
  buffer: string
  completedBlocks: SearchReplaceBlock[]
  errors: string[]
  warnings: string[]
}

export interface StreamingParseResult {
  state: StreamingParseState
  newBlocks: SearchReplaceBlock[]
  hasNewContent: boolean
}

// 创建初始的流式解析状态
export function createStreamingParseState(): StreamingParseState {
  return {
    currentBlock: {},
    state: ProcessingState.IDLE,
    searchLines: [],
    replaceLines: [],
    blockIndex: 0,
    buffer: '',
    completedBlocks: [],
    errors: [],
    warnings: []
  }
}

// 增量解析流式内容
export function parseStreamingChunk(
  chunk: string, 
  state: StreamingParseState
): StreamingParseResult {
  // 将新块添加到缓冲区
  state.buffer += chunk
  
  const newBlocks: SearchReplaceBlock[] = []
  let hasNewContent = false
  
  // 按行分割并处理
  const lines = state.buffer.split('\n')
  
  // 保留最后一行（可能不完整）在缓冲区中
  const incompleteLastLine = lines.pop() || ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const result = processStreamingLine(line, state, i)
    
    if (result.completedBlock) {
      newBlocks.push(result.completedBlock)
      state.completedBlocks.push(result.completedBlock)
      hasNewContent = true
    }
    
    if (result.error) {
      state.errors.push(result.error)
    }
    
    if (result.warning) {
      state.warnings.push(result.warning)
    }
  }
  
  // 更新缓冲区为未完成的最后一行
  state.buffer = incompleteLastLine
  
  return {
    state,
    newBlocks,
    hasNewContent
  }
}

// 处理单行流式内容
function processStreamingLine(
  line: string, 
  state: StreamingParseState, 
  lineNumber: number
): {
  completedBlock?: SearchReplaceBlock
  error?: string
  warning?: string
} {
  const trimmedLine = line.trim()
  
  // 检测SEARCH块开始
  if (isSearchBlockStart(trimmedLine)) {
    if (state.state !== ProcessingState.IDLE) {
      // 未完成的块，发出警告
      return {
        warning: `第 ${lineNumber + 1} 行: 检测到未完成的SEARCH/REPLACE块，自动恢复处理`
      }
    }
    
    state.state = ProcessingState.IN_SEARCH_BLOCK
    state.searchLines = []
    state.replaceLines = []
    state.currentBlock = { blockIndex: state.blockIndex++ }
    return {}
  }
  
  // 检测分隔符
  if (isSeparatorLine(trimmedLine)) {
    if (state.state === ProcessingState.IN_SEARCH_BLOCK) {
      if (state.searchLines.length === 0) {
        return {
          error: `第 ${lineNumber + 1} 行: SEARCH块为空`
        }
      }
      state.state = ProcessingState.IN_REPLACE_BLOCK
      state.currentBlock.searchContent = state.searchLines.join('\n')
      return {}
    }
    return {}
  }
  
  // 检测REPLACE块结束
  if (isReplaceBlockEnd(trimmedLine)) {
    if (state.state === ProcessingState.IN_REPLACE_BLOCK) {
      state.currentBlock.replaceContent = state.replaceLines.join('\n')
      
      // 验证块的有效性
      if (validateBlock(state.currentBlock as SearchReplaceBlock)) {
        const completedBlock = state.currentBlock as SearchReplaceBlock
        state.currentBlock = {}
        state.state = ProcessingState.IDLE
        return { completedBlock }
      } else {
        return {
          error: `第 ${lineNumber + 1} 行: 块验证失败`
        }
      }
    }
    return {}
  }
  
  // 累积内容行
  if (state.state === ProcessingState.IN_SEARCH_BLOCK) {
    state.searchLines.push(line)
  } else if (state.state === ProcessingState.IN_REPLACE_BLOCK) {
    state.replaceLines.push(line)
  }
  
  return {}
}

// 完成流式解析，处理未完成的块
export function finishStreamingParse(state: StreamingParseState): SearchReplaceBlock[] {
  const finalBlocks: SearchReplaceBlock[] = []
  
  // 处理缓冲区中的剩余内容
  if (state.buffer.trim()) {
    const result = parseStreamingChunk('', state) // 触发最终处理
    finalBlocks.push(...result.newBlocks)
  }
  
  // 尝试恢复未完成的块
  if (state.state !== ProcessingState.IDLE && state.searchLines.length > 0) {
    if (state.state === ProcessingState.IN_REPLACE_BLOCK) {
      // 假设没有REPLACE结束标记
      state.currentBlock.replaceContent = state.replaceLines.join('\n')
      if (validateBlock(state.currentBlock as SearchReplaceBlock)) {
        finalBlocks.push(state.currentBlock as SearchReplaceBlock)
        state.warnings.push('已自动恢复文件结尾的REPLACE块')
      }
    } else if (state.state === ProcessingState.IN_SEARCH_BLOCK) {
      state.warnings.push(`检测到未完成的SEARCH块，包含 ${state.searchLines.length} 行内容`)
    }
  }
  
  return finalBlocks
}

// 获取流式解析的统计信息
export function getStreamingStats(state: StreamingParseState) {
  return {
    completedBlocks: state.completedBlocks.length,
    currentState: state.state,
    hasIncompleteBlock: state.state !== ProcessingState.IDLE,
    bufferLength: state.buffer.length,
    errors: state.errors.length,
    warnings: state.warnings.length
  }
}

// 块锚点匹配（使用首末行作为锚点）
function findBlockAnchorMatch(content: string, searchContent: string) {
  const contentLines = content.split('\n')
  const searchLines = searchContent.split('\n')
  
  if (searchLines.length < 3) return null
  
  const firstLine = searchLines[0].trim()
  const lastLine = searchLines[searchLines.length - 1].trim()
  const blockSize = searchLines.length
  
  for (let i = 0; i <= contentLines.length - blockSize; i++) {
    if (contentLines[i].trim() === firstLine && 
        contentLines[i + blockSize - 1].trim() === lastLine) {
      
      let start = 0
      for (let k = 0; k < i; k++) {
        start += contentLines[k].length + 1
      }
      
      let end = start
      for (let k = 0; k < blockSize; k++) {
        end += contentLines[i + k].length + 1
      }
      
      return { start, end }
    }
  }
  
  return null
}

// ========== 新增的增强匹配函数 ==========


