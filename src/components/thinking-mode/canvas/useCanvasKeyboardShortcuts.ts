'use client'

import { useEffect, useCallback, useRef } from 'react'
import { CanvasCard } from '@/types/canvas'

interface UseCanvasKeyboardShortcutsProps {
  selectedCardIds: string[]
  cards: CanvasCard[]
  onRemoveCard: (id: string) => void
  onSelectCard: (id: string, isMulti: boolean) => void
  onClearSelection: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onFitToScreen: () => void
  onToggleAIInput: () => void
}

export function useCanvasKeyboardShortcuts({
  selectedCardIds,
  cards,
  onRemoveCard,
  onSelectCard,
  onClearSelection,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onFitToScreen,
  onToggleAIInput
}: UseCanvasKeyboardShortcutsProps) {
  const isSpacePressed = useRef(false)
  const lastSelectedIndex = useRef(-1)

  // 处理键盘按下事件
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const target = e.target as HTMLElement
    
    // 如果正在输入框中输入，忽略快捷键
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    // 空格键 - 平移模式
    if (e.code === 'Space' && !isSpacePressed.current) {
      e.preventDefault()
      isSpacePressed.current = true
      document.body.style.cursor = 'grab'
      return
    }

    // Ctrl/Cmd + 组合键
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case '=':
        case '+':
          e.preventDefault()
          onZoomIn()
          break
        case '-':
          e.preventDefault()
          onZoomOut()
          break
        case '0':
          e.preventDefault()
          onZoomReset()
          break
        case 'a':
          e.preventDefault()
          // 全选卡片
          cards.forEach(card => {
            onSelectCard(card.id, true)
          })
          break
        case 'j':
          e.preventDefault()
          onToggleAIInput()
          break
      }
      return
    }

    // 单键快捷键
    switch (e.key) {
      case 'Delete':
      case 'Backspace':
        e.preventDefault()
        selectedCardIds.forEach(id => {
          onRemoveCard(id)
        })
        break
      
      case 'Escape':
        e.preventDefault()
        onClearSelection()
        break
      
      case 'f':
        e.preventDefault()
        onFitToScreen()
        break
      
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        e.preventDefault()
        handleArrowKeyNavigation(e.key)
        break
    }
  }, [
    selectedCardIds,
    cards,
    onRemoveCard,
    onSelectCard,
    onClearSelection,
    onZoomIn,
    onZoomOut,
    onZoomReset,
    onFitToScreen,
    onToggleAIInput
  ])

  // 处理键盘松开事件
  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    if (e.code === 'Space' && isSpacePressed.current) {
      isSpacePressed.current = false
      document.body.style.cursor = 'default'
    }
  }, [])

  // 处理方向键导航
  const handleArrowKeyNavigation = useCallback((key: string) => {
    if (cards.length === 0) return

    let nextIndex = 0
    
    if (selectedCardIds.length === 1) {
      const currentIndex = cards.findIndex(card => card.id === selectedCardIds[0])
      if (currentIndex !== -1) {
        switch (key) {
          case 'ArrowUp':
            nextIndex = Math.max(0, currentIndex - 1)
            break
          case 'ArrowDown':
            nextIndex = Math.min(cards.length - 1, currentIndex + 1)
            break
          case 'ArrowLeft':
            nextIndex = Math.max(0, currentIndex - 1)
            break
          case 'ArrowRight':
            nextIndex = Math.min(cards.length - 1, currentIndex + 1)
            break
        }
      }
    } else {
      // 如果没有选中卡片，选中第一个
      nextIndex = 0
    }

    const nextCard = cards[nextIndex]
    if (nextCard) {
      onClearSelection()
      onSelectCard(nextCard.id, false)
      lastSelectedIndex.current = nextIndex
    }
  }, [cards, selectedCardIds, onClearSelection, onSelectCard])

  // 绑定键盘事件
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      // 清理样式
      document.body.style.cursor = 'default'
    }
  }, [handleKeyDown, handleKeyUp])

  // 返回当前空格键状态
  return {
    isSpacePressed: isSpacePressed.current
  }
}