'use client'

import React, { useState } from 'react'

interface ConnectionShortcutsHelpProps {
  selectedConnectionId: string | null
}

export function ConnectionShortcutsHelp({ selectedConnectionId }: ConnectionShortcutsHelpProps) {
  const [isVisible, setIsVisible] = useState(false)
  
  if (!selectedConnectionId) return null
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 快捷键帮助按钮 */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors"
        title="连接快捷键帮助"
      >
        <i className="fas fa-question text-sm"></i>
      </button>
      
      {/* 快捷键帮助面板 */}
      {isVisible && (
        <div className="absolute bottom-10 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-4 min-w-64">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-800">连接线快捷键</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">选中连接线</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">点击连接线</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">删除连接</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">Backspace / Delete</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">切换状态</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">Space / Enter</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">快速状态</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">1-4</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">取消选中</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">Escape</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">双击切换</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">双击连接线</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">右键菜单</span>
              <span className="text-xs bg-gray-100 px-2 py-1 rounded">右键连接线</span>
            </div>
          </div>
          
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="text-xs text-gray-500 text-center">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-1"></span>
              连接线已选中
            </div>
          </div>
        </div>
      )}
    </div>
  )
}