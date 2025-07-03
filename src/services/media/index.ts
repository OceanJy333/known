// 媒体服务统一出口
export * from './base'
export * from './text'
export * from './processors'

import { MediaProcessorFactory } from './base'
import { TextMediaProcessor } from './text'
import { 
  PDFMediaProcessor, 
  VideoMediaProcessor, 
  AudioMediaProcessor, 
  WebpageMediaProcessor 
} from './processors'
import { MediaType } from '@/types/media'

// 注册所有媒体处理器
export function initializeMediaProcessors() {
  MediaProcessorFactory.register(MediaType.TEXT, new TextMediaProcessor())
  MediaProcessorFactory.register(MediaType.MARKDOWN, new TextMediaProcessor()) // Markdown使用文本处理器
  MediaProcessorFactory.register(MediaType.PDF, new PDFMediaProcessor())
  MediaProcessorFactory.register(MediaType.VIDEO, new VideoMediaProcessor())
  MediaProcessorFactory.register(MediaType.AUDIO, new AudioMediaProcessor())
  MediaProcessorFactory.register(MediaType.WEBPAGE, new WebpageMediaProcessor())
}

// 根据文件类型检测媒体类型
export function detectMediaType(file: File): MediaType {
  const extension = file.name.split('.').pop()?.toLowerCase()
  const mimeType = file.type.toLowerCase()
  
  // 根据MIME类型判断
  if (mimeType.startsWith('video/')) return MediaType.VIDEO
  if (mimeType.startsWith('audio/')) return MediaType.AUDIO
  if (mimeType.startsWith('image/')) return MediaType.IMAGE
  if (mimeType === 'application/pdf') return MediaType.PDF
  
  // 根据文件扩展名判断
  switch (extension) {
    case 'md':
    case 'markdown':
      return MediaType.MARKDOWN
    case 'txt':
    case 'text':
      return MediaType.TEXT
    case 'pdf':
      return MediaType.PDF
    case 'html':
    case 'htm':
      return MediaType.WEBPAGE
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'webm':
      return MediaType.VIDEO
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
      return MediaType.AUDIO
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return MediaType.IMAGE
    default:
      return MediaType.TEXT // 默认作为文本处理
  }
}

// 检查媒体类型是否受支持
export function isMediaTypeSupported(mediaType: MediaType): boolean {
  return MediaProcessorFactory.isSupported(mediaType)
}

// 获取支持的媒体类型列表
export function getSupportedMediaTypes(): MediaType[] {
  return MediaProcessorFactory.getSupportedTypes()
}