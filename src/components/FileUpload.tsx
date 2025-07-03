'use client'

import { useCallback, useState, useRef } from 'react'
import { useDropzone } from 'react-dropzone'

interface ContentInputProps {
  onContentSubmit: (content: string, filename: string) => void
}

export default function ContentInput({ onContentSubmit }: ContentInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const content = e.target?.result as string
        onContentSubmit(content, file.name)
      }
      reader.readAsText(file)
    }
    setIsDragOver(false)
  }, [onContentSubmit])

  const { getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/markdown': ['.md'],
      'text/plain': ['.txt', '.text'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false,
    noClick: true,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false)
  })

  const handleSubmit = () => {
    if (inputValue.trim()) {
      onContentSubmit(inputValue, '输入内容.txt')
      setInputValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    // 自动调整高度
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <input {...getInputProps()} />
      <div className={`relative bg-white dark:bg-gray-800 rounded-[32px] border-2 transition-all duration-200 ${
        isDragOver || isDragActive 
          ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } shadow-lg`}>
        
        {/* 拖拽提示覆盖层 */}
        {(isDragOver || isDragActive) && (
          <div className="absolute inset-0 flex items-center justify-center bg-blue-50/90 dark:bg-blue-900/90 rounded-[32px] z-10 border-2 border-dashed border-blue-400">
            <div className="text-center">
              <i className="fas fa-download text-4xl text-blue-500 mb-2 animate-bounce"></i>
              <p className="text-lg font-semibold text-blue-700 dark:text-blue-300">松开鼠标上传文件</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">支持 .md、.txt、.pdf、.doc 和 .docx 格式</p>
            </div>
          </div>
        )}

        <div className="flex items-end p-4 gap-3">
          {/* 输入框 */}
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder=""
              className="w-full resize-none border-0 outline-none bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 text-base leading-relaxed min-h-[24px] max-h-[200px] overflow-hidden"
              rows={1}
              style={{ height: '24px' }}
            />
          </div>

          {/* 发送按钮 */}
          <button
            onClick={handleSubmit}
            disabled={!inputValue.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ease-in-out ${
              inputValue.trim()
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
            }`}
            title="发送 (Enter)"
          >
            <i className={`fas fa-arrow-up text-sm transition-transform duration-200 ${
              inputValue.trim() ? 'transform rotate-0' : ''
            }`}></i>
          </button>
        </div>

      </div>
    </div>
  )
}