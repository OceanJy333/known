/**
 * 沉思模式ID管理Hook
 * 提供统一的ID操作接口，自动处理ID验证和错误恢复
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { thinkingModeIdManager } from '@/utils/thinkingModeIdManager'
import { KnowledgeNote } from '@/types/knowledge'
import { CanvasCard, Position } from '@/types/canvas'

export interface UseThinkingModeIdsOptions {
  // 是否启用自动修复
  autoFix?: boolean
  // 是否启用调试模式
  debug?: boolean
  // 验证间隔（毫秒）
  validationInterval?: number
  // 错误回调
  onError?: (error: string) => void
  // 警告回调
  onWarning?: (warning: string) => void
}

export interface ThinkingModeIdOperations {
  // 注册操作
  registerNote: (note: KnowledgeNote) => void
  registerCard: (card: CanvasCard) => void
  registerOutputNode: (node: any) => void
  registerConnection: (connection: any) => void
  registerMessage: (message: any) => void
  
  // 移除注册
  unregisterCard: (cardId: string) => void
  unregisterConnection: (connectionId: string) => void
  unregisterOutputNode: (nodeId: string) => void
  
  // 安全操作
  safeAddCard: (noteId: string, position: Position, addCardFn: (params: { noteId: string; position: Position }) => string) => Promise<string | null>
  safeCreateConnection: (fromId: string, toId: string, addConnectionFn: (connection: any) => void) => Promise<string | null>
  
  // 验证和修复
  validateIds: () => Promise<boolean>
  fixIds: () => Promise<boolean>
  
  // 查询操作
  getCardByNoteId: (noteId: string) => CanvasCard | null
  getNoteByCardId: (cardId: string) => KnowledgeNote | null
  getRelationshipInfo: (id: string) => any
  
  // 状态
  isValid: boolean
  lastValidation: Date | null
  errorCount: number
  warningCount: number
}

export function useThinkingModeIds(options: UseThinkingModeIdsOptions = {}): ThinkingModeIdOperations {
  const {
    autoFix = true,
    debug = false,
    validationInterval = 5000,
    onError,
    onWarning
  } = options

  const [isValid, setIsValid] = useState(true)
  const [lastValidation, setLastValidation] = useState<Date | null>(null)
  const [errorCount, setErrorCount] = useState(0)
  const [warningCount, setWarningCount] = useState(0)
  
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const mountedRef = useRef(true)

  // 初始化
  useEffect(() => {
    thinkingModeIdManager.setDebugMode(debug)
    
    // 清理函数
    return () => {
      mountedRef.current = false
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [debug])

  // 定期验证
  useEffect(() => {
    if (validationInterval > 0) {
      const scheduleValidation = () => {
        validationTimeoutRef.current = setTimeout(async () => {
          if (mountedRef.current) {
            await validateIds()
            scheduleValidation()
          }
        }, validationInterval)
      }
      
      scheduleValidation()
    }
    
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current)
      }
    }
  }, [validationInterval])

  // 注册笔记
  const registerNote = useCallback((note: KnowledgeNote) => {
    try {
      thinkingModeIdManager.registerNote(note)
    } catch (error) {
      onError?.(`注册笔记失败: ${error}`)
    }
  }, [onError])

  // 注册卡片
  const registerCard = useCallback((card: CanvasCard) => {
    try {
      thinkingModeIdManager.registerCard(card)
    } catch (error) {
      onError?.(`注册卡片失败: ${error}`)
    }
  }, [onError])

  // 注册输出节点
  const registerOutputNode = useCallback((node: any) => {
    try {
      thinkingModeIdManager.registerOutputNode(node)
    } catch (error) {
      onError?.(`注册输出节点失败: ${error}`)
    }
  }, [onError])

  // 注册连接线
  const registerConnection = useCallback((connection: any) => {
    try {
      thinkingModeIdManager.registerConnection(connection)
    } catch (error) {
      onError?.(`注册连接线失败: ${error}`)
    }
  }, [onError])

  // 注册消息
  const registerMessage = useCallback((message: any) => {
    try {
      thinkingModeIdManager.registerMessage(message)
    } catch (error) {
      onError?.(`注册消息失败: ${error}`)
    }
  }, [onError])

  // 移除卡片注册
  const unregisterCard = useCallback((cardId: string) => {
    try {
      thinkingModeIdManager.unregisterCard(cardId)
    } catch (error) {
      onError?.(`移除卡片注册失败: ${error}`)
    }
  }, [onError])

  // 移除连接线注册
  const unregisterConnection = useCallback((connectionId: string) => {
    try {
      thinkingModeIdManager.unregisterConnection(connectionId)
    } catch (error) {
      onError?.(`移除连接线注册失败: ${error}`)
    }
  }, [onError])

  // 移除输出节点注册
  const unregisterOutputNode = useCallback((nodeId: string) => {
    try {
      thinkingModeIdManager.unregisterOutputNode(nodeId)
    } catch (error) {
      onError?.(`移除输出节点注册失败: ${error}`)
    }
  }, [onError])

  // 安全添加卡片
  const safeAddCard = useCallback(async (
    noteId: string, 
    position: Position, 
    addCardFn: (params: { noteId: string; position: Position }) => string
  ): Promise<string | null> => {
    try {
      const cardId = thinkingModeIdManager.safeAddCard(noteId, position, addCardFn)
      if (!cardId) {
        onError?.(`安全添加卡片失败: noteId=${noteId}`)
      }
      return cardId
    } catch (error) {
      onError?.(`安全添加卡片异常: ${error}`)
      return null
    }
  }, [onError])

  // 安全创建连接
  const safeCreateConnection = useCallback(async (
    fromId: string, 
    toId: string, 
    addConnectionFn: (connection: any) => void
  ): Promise<string | null> => {
    try {
      const connectionId = thinkingModeIdManager.safeCreateConnection(fromId, toId, addConnectionFn)
      if (!connectionId) {
        onError?.(`安全创建连接失败: ${fromId} -> ${toId}`)
      }
      return connectionId
    } catch (error) {
      onError?.(`安全创建连接异常: ${error}`)
      return null
    }
  }, [onError])

  // 验证ID
  const validateIds = useCallback(async (): Promise<boolean> => {
    try {
      const result = thinkingModeIdManager.validateAllRelationships()
      
      setIsValid(result.valid)
      setLastValidation(new Date())
      setErrorCount(result.errors.length)
      setWarningCount(result.warnings.length)
      
      // 报告错误和警告
      result.errors.forEach(error => onError?.(error))
      result.warnings.forEach(warning => onWarning?.(warning))
      
      // 如果启用自动修复且存在错误
      if (autoFix && !result.valid) {
        const fixResult = await fixIds()
        return fixResult
      }
      
      return result.valid
    } catch (error) {
      onError?.(`验证ID失败: ${error}`)
      return false
    }
  }, [autoFix, onError, onWarning])

  // 修复ID
  const fixIds = useCallback(async (): Promise<boolean> => {
    try {
      const result = thinkingModeIdManager.autoFixRelationships()
      
      if (result.fixed) {
        // 重新验证
        setTimeout(() => {
          validateIds()
        }, 100)
      }
      
      result.errors.forEach(error => onError?.(error))
      
      return result.fixed
    } catch (error) {
      onError?.(`修复ID失败: ${error}`)
      return false
    }
  }, [onError, validateIds])

  // 根据笔记ID获取卡片
  const getCardByNoteId = useCallback((noteId: string): CanvasCard | null => {
    try {
      const cardIds = thinkingModeIdManager.getRelationshipInfo(noteId)?.relations?.cards || []
      if (cardIds.length > 0) {
        return thinkingModeIdManager.getRelationshipInfo(cardIds[0])?.data || null
      }
      return null
    } catch (error) {
      onError?.(`获取卡片失败: ${error}`)
      return null
    }
  }, [onError])

  // 根据卡片ID获取笔记
  const getNoteByCardId = useCallback((cardId: string): KnowledgeNote | null => {
    try {
      const cardInfo = thinkingModeIdManager.getRelationshipInfo(cardId)
      if (cardInfo?.relations?.note) {
        return thinkingModeIdManager.getRelationshipInfo(cardInfo.relations.note)?.data || null
      }
      return null
    } catch (error) {
      onError?.(`获取笔记失败: ${error}`)
      return null
    }
  }, [onError])

  // 获取关系信息
  const getRelationshipInfo = useCallback((id: string) => {
    try {
      return thinkingModeIdManager.getRelationshipInfo(id)
    } catch (error) {
      onError?.(`获取关系信息失败: ${error}`)
      return null
    }
  }, [onError])

  return {
    // 注册操作
    registerNote,
    registerCard,
    registerOutputNode,
    registerConnection,
    registerMessage,
    
    // 移除注册
    unregisterCard,
    unregisterConnection,
    unregisterOutputNode,
    
    // 安全操作
    safeAddCard,
    safeCreateConnection,
    
    // 验证和修复
    validateIds,
    fixIds,
    
    // 查询操作
    getCardByNoteId,
    getNoteByCardId,
    getRelationshipInfo,
    
    // 状态
    isValid,
    lastValidation,
    errorCount,
    warningCount
  }
}

// 便捷的调试Hook
export function useThinkingModeDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  
  const refreshDebugInfo = useCallback(() => {
    setDebugInfo(thinkingModeIdManager.getDebugInfo())
  }, [])
  
  useEffect(() => {
    refreshDebugInfo()
  }, [refreshDebugInfo])
  
  return {
    debugInfo,
    refreshDebugInfo,
    enable: () => thinkingModeIdManager.setDebugMode(true),
    disable: () => thinkingModeIdManager.setDebugMode(false),
    inspect: (id: string) => thinkingModeIdManager.getRelationshipInfo(id),
    validateAndFix: () => {
      const validation = thinkingModeIdManager.validateAllRelationships()
      console.log('ID验证结果:', validation)
      
      if (!validation.valid) {
        const fixResult = thinkingModeIdManager.autoFixRelationships()
        console.log('自动修复结果:', fixResult)
        return fixResult
      }
      
      return { fixed: false, message: '无需修复' }
    }
  }
}