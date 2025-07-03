// 媒体类型枚举
export enum MediaType {
  TEXT = 'text',
  MARKDOWN = 'markdown', 
  PDF = 'pdf',
  VIDEO = 'video',
  AUDIO = 'audio',
  WEBPAGE = 'webpage',
  IMAGE = 'image'
}

// 定位信息接口 - 支持多种媒体的定位方式
export interface LocationInfo {
  // 文本定位
  textAnchor?: string         // 文本锚点（前几个字符）
  charPosition?: number       // 字符位置
  lineNumber?: number         // 行号
  
  // PDF定位
  pageNumber?: number         // PDF页号
  pdfCoordinates?: {          // PDF坐标
    x: number
    y: number
    width?: number
    height?: number
  }
  
  // 视频/音频定位
  timestamp?: number          // 时间戳（秒）
  timeRange?: {               // 时间范围
    start: number
    end: number
  }
  
  // 网页定位
  urlHash?: string            // URL片段标识符
  cssSelector?: string        // CSS选择器
  xPath?: string              // XPath
  
  // 图片定位
  imageCoordinates?: {        // 图片坐标
    x: number
    y: number
    width?: number
    height?: number
  }
}

// 段落内容接口
export interface DocumentSection {
  id: string
  title: string
  level: number
  summary: string
  
  // 媒体信息
  mediaType: MediaType
  location: LocationInfo
  
  // 可选的预览信息
  preview?: {
    thumbnail?: string        // 缩略图URL
    excerpt?: string          // 内容摘录
    duration?: number         // 持续时间（音视频）
  }
}

// 媒体文件信息
export interface MediaFile {
  id: string
  name: string
  type: MediaType
  url?: string                // 文件URL
  content?: string            // 文本内容
  metadata?: {
    size?: number             // 文件大小
    duration?: number         // 持续时间
    pageCount?: number        // 页面数量
    dimensions?: {            // 尺寸
      width: number
      height: number
    }
    [key: string]: any        // 其他元数据
  }
}

// 跳转请求接口
export interface NavigationRequest {
  sectionId: string
  mediaType: MediaType
  location: LocationInfo
  behavior?: 'smooth' | 'instant' | 'auto'  // 跳转行为
}

// 媒体视图器接口
export interface MediaViewerProps {
  file: MediaFile
  sections: DocumentSection[]
  currentSection?: string
  onSectionChange?: (sectionId: string) => void
  onNavigate?: (request: NavigationRequest) => void
}

// AI分析配置接口
export interface AnalysisConfig {
  mediaType: MediaType
  maxSegments?: number        // 最大段落数
  includeTimestamps?: boolean // 是否包含时间戳
  includeCoordinates?: boolean // 是否包含坐标
  extractThumbnails?: boolean // 是否提取缩略图
}