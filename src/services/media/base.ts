import { MediaType, MediaFile, DocumentSection, LocationInfo, AnalysisConfig } from '@/types/media'

// 媒体处理器基类
export abstract class MediaProcessor {
  abstract mediaType: MediaType
  
  // 解析媒体文件
  abstract parseFile(file: File): Promise<MediaFile>
  
  // 提取内容用于AI分析
  abstract extractContent(mediaFile: MediaFile): Promise<string>
  
  // AI分析后处理段落定位信息
  abstract processAnalysisResult(
    sections: any[], 
    mediaFile: MediaFile
  ): Promise<DocumentSection[]>
  
  // 生成预览信息
  abstract generatePreview(
    section: DocumentSection, 
    mediaFile: MediaFile
  ): Promise<DocumentSection>
  
  // 执行跳转
  abstract navigate(
    location: LocationInfo, 
    mediaFile: MediaFile
  ): Promise<void>
  
  // 验证定位信息是否有效
  validateLocation(location: LocationInfo): boolean {
    return true // 默认实现，子类可覆盖
  }
}

// 媒体处理器工厂
export class MediaProcessorFactory {
  private static processors = new Map<MediaType, MediaProcessor>()
  
  static register(mediaType: MediaType, processor: MediaProcessor) {
    this.processors.set(mediaType, processor)
  }
  
  static getProcessor(mediaType: MediaType): MediaProcessor | null {
    return this.processors.get(mediaType) || null
  }
  
  static getSupportedTypes(): MediaType[] {
    return Array.from(this.processors.keys())
  }
  
  static isSupported(mediaType: MediaType): boolean {
    return this.processors.has(mediaType)
  }
}

// 媒体分析服务接口
export interface MediaAnalysisService {
  analyzeMedia(
    mediaFile: MediaFile, 
    config?: AnalysisConfig
  ): Promise<DocumentSection[]>
  
  updateSection(
    sectionId: string, 
    updates: Partial<DocumentSection>
  ): Promise<DocumentSection>
  
  validateSections(
    sections: DocumentSection[], 
    mediaFile: MediaFile
  ): Promise<DocumentSection[]>
}

// 媒体导航服务接口
export interface MediaNavigationService {
  navigateToSection(
    sectionId: string, 
    mediaFile: MediaFile,
    behavior?: 'smooth' | 'instant'
  ): Promise<boolean>
  
  getCurrentSection(mediaFile: MediaFile): Promise<string | null>
  
  getVisibleSections(mediaFile: MediaFile): Promise<string[]>
  
  preloadSection(sectionId: string, mediaFile: MediaFile): Promise<void>
}