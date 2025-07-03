'use client'

import { MediaViewerProps } from '@/types/media'

// PDF视图器（预留实现）
export function PDFViewer({ file, sections, currentSection }: MediaViewerProps) {
  return (
    <div className="pdf-viewer w-full h-full bg-gray-100 rounded-lg">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <i className="fas fa-file-pdf text-6xl text-red-500 mb-4"></i>
          <h3 className="text-lg font-semibold mb-2">PDF 视图器</h3>
          <p className="text-gray-600 mb-4">文件: {file.name}</p>
          <p className="text-sm text-gray-500">
            PDF 视图器功能开发中...
            <br />
            将支持页面跳转、坐标定位等功能
          </p>
        </div>
      </div>
    </div>
  )
}

// 视频视图器（预留实现）
export function VideoViewer({ file, sections, currentSection }: MediaViewerProps) {
  return (
    <div className="video-viewer w-full h-full bg-black rounded-lg">
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-white">
          <i className="fas fa-video text-6xl text-blue-500 mb-4"></i>
          <h3 className="text-lg font-semibold mb-2">视频播放器</h3>
          <p className="text-gray-300 mb-4">文件: {file.name}</p>
          <p className="text-sm text-gray-400">
            视频播放器功能开发中...
            <br />
            将支持时间戳跳转、章节导航等功能
          </p>
        </div>
      </div>
    </div>
  )
}

// 音频视图器（预留实现）
export function AudioViewer({ file, sections, currentSection }: MediaViewerProps) {
  return (
    <div className="audio-viewer w-full h-full bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <i className="fas fa-music text-6xl text-purple-500 mb-4"></i>
          <h3 className="text-lg font-semibold mb-2">音频播放器</h3>
          <p className="text-gray-700 mb-4">文件: {file.name}</p>
          <p className="text-sm text-gray-600">
            音频播放器功能开发中...
            <br />
            将支持时间戳跳转、波形显示等功能
          </p>
        </div>
      </div>
    </div>
  )
}

// 网页视图器（预留实现）
export function WebpageViewer({ file, sections, currentSection }: MediaViewerProps) {
  return (
    <div className="webpage-viewer w-full h-full bg-white border rounded-lg">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <i className="fas fa-globe text-6xl text-green-500 mb-4"></i>
          <h3 className="text-lg font-semibold mb-2">网页视图器</h3>
          <p className="text-gray-700 mb-4">文件: {file.name}</p>
          <p className="text-sm text-gray-600">
            网页视图器功能开发中...
            <br />
            将支持元素定位、CSS选择器跳转等功能
          </p>
        </div>
      </div>
    </div>
  )
}

// 图片视图器（预留实现）
export function ImageViewer({ file, sections, currentSection }: MediaViewerProps) {
  return (
    <div className="image-viewer w-full h-full bg-gray-50 rounded-lg">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <i className="fas fa-image text-6xl text-indigo-500 mb-4"></i>
          <h3 className="text-lg font-semibold mb-2">图片视图器</h3>
          <p className="text-gray-700 mb-4">文件: {file.name}</p>
          <p className="text-sm text-gray-600">
            图片视图器功能开发中...
            <br />
            将支持坐标定位、区域标注等功能
          </p>
        </div>
      </div>
    </div>
  )
}