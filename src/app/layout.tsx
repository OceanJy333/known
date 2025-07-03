import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '沉淀 - 知识内容沉淀平台',
  description: '优雅的知识内容沉淀平台，支持直接输入和文件上传，自动生成智能目录导航，专注沉浸式阅读体验',
  keywords: '沉淀, 知识管理, 内容消费, 目录导航, Markdown',
  authors: [{ name: 'AI Assistant' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className="scroll-smooth">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📖</text></svg>" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  )
}