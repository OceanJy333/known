'use client'

import { useState } from 'react'

interface ShortcutItem {
  key: string
  description: string
  category: 'tabs' | 'navigation' | 'general'
}

const shortcuts: ShortcutItem[] = [
  { key: 'Ctrl+T', description: '新建标签页', category: 'tabs' },
  { key: 'Ctrl+W', description: '关闭当前标签页', category: 'tabs' },
  { key: 'Ctrl+1-9', description: '切换到第N个标签页', category: 'tabs' },
  { key: 'Ctrl+Shift+T', description: '切换目录显示', category: 'navigation' },
  { key: 'ESC', description: '关闭目录', category: 'navigation' },
  { key: 'Ctrl+Shift+R', description: '重置当前标签页', category: 'general' },
]

export default function KeyboardShortcuts() {
  const [isVisible, setIsVisible] = useState(false)

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 w-10 h-10 bg-gray-800 dark:bg-gray-700 text-white rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-all duration-200 z-50"
        title="查看键盘快捷键"
      >
        <i className="fas fa-keyboard text-sm"></i>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            键盘快捷键
          </h3>
          <button
            onClick={() => setIsVisible(false)}
            className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center justify-center"
          >
            <i className="fas fa-times text-gray-500 dark:text-gray-400"></i>
          </button>
        </div>

        {/* 快捷键列表 */}
        <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
          {/* 标签页管理 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              📑 标签页管理
            </h4>
            <div className="space-y-2">
              {shortcuts.filter(s => s.category === 'tabs').map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {shortcut.description}
                  </span>
                  <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded border">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* 导航 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              🧭 导航
            </h4>
            <div className="space-y-2">
              {shortcuts.filter(s => s.category === 'navigation').map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {shortcut.description}
                  </span>
                  <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded border">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* 通用 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              ⚙️ 通用
            </h4>
            <div className="space-y-2">
              {shortcuts.filter(s => s.category === 'general').map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {shortcut.description}
                  </span>
                  <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-200 rounded border">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 提示 */}
        <div className="p-4 border-t border-gray-200 dark:border-slate-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            在 Mac 上使用 ⌘ 替代 Ctrl
          </p>
        </div>
      </div>
    </div>
  )
}