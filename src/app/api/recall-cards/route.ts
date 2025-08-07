import { NextRequest, NextResponse } from 'next/server'
import { getRecallService } from '@/services/recallService'
import type { KnowledgeNote } from '@/types/knowledge'
import type { RecallOptions } from '@/services/recallTypes'

export async function POST(request: NextRequest) {
  try {
    const { question, knowledgeBase, options = {} } = await request.json()
    
    // 验证必要参数
    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: '问题参数是必需的且必须是字符串' },
        { status: 400 }
      )
    }
    
    if (!Array.isArray(knowledgeBase)) {
      return NextResponse.json(
        { error: '知识库参数必须是数组' },
        { status: 400 }
      )
    }
    
    console.log('🔍 [召回 API] 开始处理召回请求:', {
      question: question.slice(0, 50) + '...',
      knowledgeBaseSize: knowledgeBase.length
    })
    
    // 调用召回服务
    const recallService = getRecallService()
    const result = await recallService.recallCards(
      question,
      knowledgeBase as KnowledgeNote[],
      options as RecallOptions
    )
    
    console.log('✅ [召回 API] 召回完成:', {
      recalledCount: result.cards.length,
      averageRelevance: result.searchStats.averageRelevance
    })
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('❌ [召回 API] 处理失败:', error)
    
    return NextResponse.json(
      { 
        error: '召回服务处理失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}