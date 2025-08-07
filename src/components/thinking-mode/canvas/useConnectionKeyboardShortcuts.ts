'use client'

import { useEffect, useCallback } from 'react'

interface UseConnectionKeyboardShortcutsProps {
  selectedConnectionId: string | null
  onDeleteConnection: (connectionId: string) => void
  onToggleConnectionStatus: (connectionId: string) => void
  onDeselectConnection: () => void
}

export function useConnectionKeyboardShortcuts({
  selectedConnectionId,
  onDeleteConnection,
  onToggleConnectionStatus,
  onDeselectConnection
}: UseConnectionKeyboardShortcutsProps) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // 只在有选中连接时处理快捷键
    if (!selectedConnectionId) return
    
    // 如果当前焦点在输入框等元素上，不处理快捷键
    const activeElement = document.activeElement
    if (activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      (activeElement as HTMLElement).isContentEditable
    )) {
      return
    }
    
    switch (event.key) {
      case 'Backspace':
      case 'Delete':
        // 删除选中的连接
        event.preventDefault()
        onDeleteConnection(selectedConnectionId)
        console.log('🗑️ 删除连接:', selectedConnectionId)
        break
        
      case 'Escape':
        // 取消选中
        event.preventDefault()
        onDeselectConnection()
        console.log('❌ 取消选中连接')
        break
        
      case ' ':
      case 'Enter':
        // 空格键或回车键切换连接状态
        event.preventDefault()
        onToggleConnectionStatus(selectedConnectionId)
        console.log('🔄 切换连接状态:', selectedConnectionId)
        break
        
      case '1':
        // 数字键1-4快速设置连接状态
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault()
          // 这里可以扩展为直接设置为ACTIVE状态
          onToggleConnectionStatus(selectedConnectionId)
          console.log('🔵 设置为激活状态:', selectedConnectionId)
        }
        break
        
      case '2':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault()
          // 设置为RELATED状态
          onToggleConnectionStatus(selectedConnectionId)
          console.log('⚪ 设置为相关状态:', selectedConnectionId)
        }
        break
        
      case '3':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault()
          // 设置为DISABLED状态
          onToggleConnectionStatus(selectedConnectionId)
          console.log('🔴 设置为禁用状态:', selectedConnectionId)
        }
        break
        
      case '4':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault()
          // 设置为NEW状态
          onToggleConnectionStatus(selectedConnectionId)
          console.log('🟢 设置为新建状态:', selectedConnectionId)
        }
        break
        
      default:
        // 不处理其他按键
        break
    }
  }, [selectedConnectionId, onDeleteConnection, onToggleConnectionStatus, onDeselectConnection])

  // 监听键盘事件
  useEffect(() => {
    // 添加键盘事件监听器
    document.addEventListener('keydown', handleKeyDown)
    
    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])
  
  // 返回快捷键说明，用于显示帮助信息
  return {
    shortcuts: [
      { key: 'Backspace / Delete', description: '删除选中的连接' },
      { key: 'Escape', description: '取消选中连接' },
      { key: 'Space / Enter', description: '切换连接状态' },
      { key: '1-4', description: '快速设置连接状态' }
    ]
  }
}