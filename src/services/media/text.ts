import { MediaProcessor } from './base'
import { MediaType, MediaFile, DocumentSection, LocationInfo } from '@/types/media'

// 文本媒体处理器
export class TextMediaProcessor extends MediaProcessor {
  mediaType = MediaType.TEXT
  
  async parseFile(file: File): Promise<MediaFile> {
    const content = await file.text()
    
    return {
      id: crypto.randomUUID(),
      name: file.name,
      type: this.mediaType,
      content,
      metadata: {
        size: file.size,
        encoding: 'utf-8',
        lineCount: content.split('\n').length,
        charCount: content.length
      }
    }
  }
  
  async extractContent(mediaFile: MediaFile): Promise<string> {
    return mediaFile.content || ''
  }
  
  async processAnalysisResult(
    sections: any[], 
    mediaFile: MediaFile
  ): Promise<DocumentSection[]> {
    const content = mediaFile.content || ''
    
    return sections.map((item: any, index: number) => ({
      id: `section-${index + 1}`,
      title: item.title || `段落 ${index + 1}`,
      level: item.level || 1,
      summary: item.summary || '该段落的内容总结',
      mediaType: this.mediaType,
      location: {
        textAnchor: item.anchor,
        charPosition: this.findCharPosition(content, item.anchor),
        lineNumber: this.findLineNumber(content, item.anchor)
      } as LocationInfo
    }))
  }
  
  async generatePreview(
    section: DocumentSection, 
    mediaFile: MediaFile
  ): Promise<DocumentSection> {
    const content = mediaFile.content || ''
    const location = section.location
    
    if (location.textAnchor && location.charPosition !== undefined) {
      const startPos = location.charPosition
      const endPos = Math.min(startPos + 200, content.length)
      const excerpt = content.substring(startPos, endPos)
      
      return {
        ...section,
        preview: {
          excerpt: excerpt + (endPos < content.length ? '...' : '')
        }
      }
    }
    
    return section
  }
  
  async navigate(location: LocationInfo, mediaFile: MediaFile): Promise<void> {
    if (location.textAnchor) {
      const element = document.getElementById(location.textAnchor)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
    }
    
    if (location.charPosition !== undefined) {
      // 基于字符位置的跳转逻辑
      this.scrollToCharPosition(location.charPosition)
    }
  }
  
  validateLocation(location: LocationInfo): boolean {
    return !!(location.textAnchor || location.charPosition !== undefined)
  }
  
  // 辅助方法
  private findCharPosition(content: string, anchor?: string): number | undefined {
    if (!anchor) return undefined
    return content.indexOf(anchor)
  }
  
  private findLineNumber(content: string, anchor?: string): number | undefined {
    if (!anchor) return undefined
    const index = content.indexOf(anchor)
    if (index === -1) return undefined
    return content.substring(0, index).split('\n').length
  }
  
  private scrollToCharPosition(charPosition: number): void {
    // 实现基于字符位置的滚动
    // 这里可以根据具体需求实现
    console.log(`Scrolling to character position: ${charPosition}`)
  }
}