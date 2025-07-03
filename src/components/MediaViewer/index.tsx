'use client'

import { useState, useEffect } from 'react'
import { MediaType, MediaFile, DocumentSection, MediaViewerProps } from '@/types/media'
import TextViewer from './TextViewer'
import { 
  PDFViewer, 
  VideoViewer, 
  AudioViewer, 
  WebpageViewer, 
  ImageViewer 
} from './ViewerStubs'

// 通用媒体视图器组件
export default function MediaViewer({ 
  file, 
  sections, 
  currentSection, 
  onSectionChange, 
  onNavigate 
}: MediaViewerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 根据媒体类型渲染对应的视图器
  const renderViewer = () => {
    const commonProps = {
      file,
      sections,
      currentSection,
      onSectionChange,
      onNavigate
    }

    switch (file.type) {
      case MediaType.TEXT:
      case MediaType.MARKDOWN:
        return <TextViewer {...commonProps} />
      
      case MediaType.PDF:
        return <PDFViewer {...commonProps} />
      
      case MediaType.VIDEO:
        return <VideoViewer {...commonProps} />
      
      case MediaType.AUDIO:
        return <AudioViewer {...commonProps} />
      
      case MediaType.WEBPAGE:
        return <WebpageViewer {...commonProps} />
      
      case MediaType.IMAGE:
        return <ImageViewer {...commonProps} />
      
      default:
        return (
          <div className="flex items-center justify-center h-64 text-gray-500">
            不支持的媒体类型: {file.type}
          </div>
        )
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-500">
        <div className="text-center">
          <p className="mb-2">加载失败</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="media-viewer w-full h-full">
      {renderViewer()}
    </div>
  )
}

// 导出所有视图器组件
export { 
  TextViewer, 
  PDFViewer, 
  VideoViewer, 
  AudioViewer, 
  WebpageViewer, 
  ImageViewer 
}