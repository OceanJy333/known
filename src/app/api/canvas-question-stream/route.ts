import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { question, knowledgeBase } = await request.json()

    if (!question?.trim()) {
      return NextResponse.json(
        { error: '问题不能为空' },
        { status: 400 }
      )
    }

    console.log('🤔 [Canvas Question] 开始处理画布问题:', {
      questionLength: question.length,
      questionPreview: question.slice(0, 50) + (question.length > 50 ? '...' : ''),
      knowledgeBaseSize: knowledgeBase?.length || 0,
      hasKnowledgeBase: !!knowledgeBase && knowledgeBase.length > 0,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    })

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          // 发送处理开始事件
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              status: 'analyzing_question',
              message: '正在分析问题...'
            })}\n\n`)
          )

          // 第一步：分析问题并提取关键词
          const keywordExtractionPrompt = `请分析以下问题，提取关键词和语义信息，用于搜索相关笔记：

问题：${question}

请返回JSON格式：
{
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "semantic_intent": "问题的语义意图",
  "search_concepts": ["搜索概念1", "搜索概念2"],
  "question_type": "问题类型（如：how-to, what-is, analysis等）"
}`

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              status: 'extracting_keywords',
              message: '正在提取关键词...'
            })}\n\n`)
          )

          const keywordResponse = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: '你是一个问题分析专家，擅长从用户问题中提取关键信息用于知识检索。'
              },
              {
                role: 'user',
                content: keywordExtractionPrompt
              }
            ],
            temperature: 0.1,
          })

          let keywordData
          try {
            const keywordContent = keywordResponse.choices[0]?.message?.content || '{}'
            keywordData = JSON.parse(keywordContent)
          } catch (e) {
            console.warn('关键词提取结果解析失败，使用默认值')
            keywordData = {
              keywords: [question.slice(0, 20)],
              semantic_intent: question,
              search_concepts: [question],
              question_type: 'general'
            }
          }

          // 发送关键词提取结果
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'keywords',
              data: keywordData
            })}\n\n`)
          )

          // 第二步：智能笔记搜索（使用LLM进行语义匹配）
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              status: 'searching_notes',
              message: '正在搜索相关笔记...'
            })}\n\n`)
          )

          let relatedNotes = []

          // 检查是否有知识库数据
          if (!knowledgeBase || knowledgeBase.length === 0) {
            console.warn('⚠️ 知识库为空，使用空结果')
            relatedNotes = []
          } else {
            try {
              // 优化知识库数据传递（避免token超限）
              const optimizedKnowledgeBase = knowledgeBase
                .slice(0, 50) // 限制数量
                .map((note: any) => ({
                  id: note.id,
                  title: note.title || '无标题',
                  summary: (note.summary || '').slice(0, 200), // 截断摘要
                  tags: note.tags || [],
                  category: note.category || '未分类'
                }))

              console.log('🔍 开始智能匹配，知识库大小:', optimizedKnowledgeBase.length)

              // 构建智能匹配prompt
              const matchingPrompt = `作为知识检索专家，请从用户的笔记库中找出与问题最相关的笔记。

用户问题：${question}
问题关键词：${keywordData.keywords ? keywordData.keywords.join(', ') : '无'}
问题类型：${keywordData.question_type || '一般'}

可用笔记列表：
${optimizedKnowledgeBase.map((note: any, i: number) => 
  `${i}. [${note.category}] ${note.title}
   摘要：${note.summary}
   标签：${note.tags.join(', ')}`
).join('\n\n')}

请分析并返回JSON格式：
{
  "analysis": "简要分析问题意图和搜索策略",
  "matches": [
    {
      "noteIndex": 0,
      "relevanceScore": 0.95,
      "matchReason": "匹配原因说明",
      "matchedKeywords": ["关键词1", "关键词2"]
    }
  ],
  "totalMatches": 3
}

要求：
1. 只返回相关度 > 0.6 的笔记
2. 最多返回5个匹配结果
3. 按相关度降序排列
4. 如果没有相关笔记，matches数组为空`

              const matchingResponse = await openai.chat.completions.create({
                model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
                messages: [
                  {
                    role: 'system',
                    content: '你是一个知识检索专家，擅长从大量笔记中找出与用户问题最相关的内容。请严格按照JSON格式返回结果。'
                  },
                  {
                    role: 'user',
                    content: matchingPrompt
                  }
                ],
                temperature: 0.1,
              })

              // 解析LLM匹配结果
              let matchResult
              try {
                const matchContent = matchingResponse.choices[0]?.message?.content || '{}'
                matchResult = JSON.parse(matchContent)
                console.log('🎯 LLM匹配结果:', matchResult)
              } catch (e) {
                console.warn('⚠️ LLM结果解析失败，使用关键词fallback:', e)
                matchResult = { matches: [], analysis: '解析失败，使用备用方案' }
              }

              // 基于LLM结果构建相关笔记
              if (matchResult.matches && Array.isArray(matchResult.matches)) {
                relatedNotes = matchResult.matches
                  .filter((match: any) => 
                    match.noteIndex >= 0 && 
                    match.noteIndex < optimizedKnowledgeBase.length &&
                    match.relevanceScore > 0.6
                  )
                  .slice(0, 5) // 最多5个
                  .map((match: any) => {
                    const originalNote = optimizedKnowledgeBase[match.noteIndex]
                    const fullNote = knowledgeBase.find((n: any) => n.id === originalNote.id)
                    
                    return {
                      id: originalNote.id,
                      title: originalNote.title,
                      summary: originalNote.summary,
                      content: fullNote?.content || originalNote.summary,
                      relevanceScore: match.relevanceScore,
                      matchedKeywords: match.matchedKeywords || [],
                      matchReason: match.matchReason || '',
                      tags: originalNote.tags,
                      category: originalNote.category,
                      // 保持原始笔记的其他属性
                      createdAt: fullNote?.createdAt || new Date(),
                      updatedAt: fullNote?.updatedAt || new Date(),
                    }
                  })
              }

              console.log('✅ 智能匹配完成，找到相关笔记:', relatedNotes.length)

            } catch (error) {
              console.error('❌ 智能匹配失败:', error)
              
              // Fallback: 使用简单关键词匹配
              console.log('🔄 使用关键词fallback匹配')
              if (keywordData.keywords && keywordData.keywords.length > 0) {
                relatedNotes = knowledgeBase
                  .filter((note: any) => {
                    const searchText = `${note.title} ${note.summary} ${note.tags?.join(' ')}`.toLowerCase()
                    return keywordData.keywords.some((keyword: any) => 
                      searchText.includes(keyword.toLowerCase())
                    )
                  })
                  .slice(0, 5)
                  .map((note: any, index: number) => ({
                    ...note,
                    relevanceScore: 0.7 - (index * 0.1), // 简单评分
                    matchedKeywords: keywordData.keywords.filter((keyword: any) =>
                      `${note.title} ${note.summary}`.toLowerCase().includes(keyword.toLowerCase())
                    ),
                    matchReason: '关键词匹配'
                  }))
              }
            }
          }

          // 发送搜索结果
          console.log('📤 [Canvas Question] 发送笔记数据到前端:', {
            notesCount: relatedNotes.length,
            notesList: relatedNotes.map((note: any) => ({
              id: note.id,
              title: note.title,
              relevanceScore: note.relevanceScore
            })),
            timestamp: new Date().toISOString()
          })
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'notes',
              data: relatedNotes
            })}\n\n`)
          )

          // 第三步：生成回答
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              status: 'generating_answer',
              message: '正在生成回答...'
            })}\n\n`)
          )

          // 根据是否找到相关笔记来生成不同的回答策略
          let answerPrompt
          
          if (relatedNotes.length === 0) {
            // 没有找到相关笔记时的回答
            answerPrompt = `用户问题：${question}

很抱歉，在当前的知识库中没有找到与您问题直接相关的笔记内容。

请基于您的专业知识，为用户提供一个有价值的回答：
1. 分析问题的核心要点
2. 提供实用的建议和方法
3. 给出具体的实践步骤
4. 指出相关的注意事项

回答要专业、实用、简洁明了。`
          } else {
            // 基于找到的相关笔记生成回答
            answerPrompt = `基于以下相关笔记内容，回答用户的问题：

问题：${question}

相关笔记：
${relatedNotes.map((note: any, index: number) => 
  `${index + 1}. ${note.title} (相关度: ${(note.relevanceScore * 100).toFixed(0)}%)
   摘要：${note.summary}
   匹配原因：${note.matchReason || '语义相关'}
   关键词：${note.matchedKeywords?.join(', ') || '无'}
   ---`
).join('\n')}

请提供一个结构化的回答，包括：
1. 问题的核心要点分析
2. 基于相关笔记的具体建议
3. 实践方法和操作步骤
4. 相关注意事项和延伸思考

回答要：
- 充分利用笔记中的信息
- 逻辑清晰，结构化呈现
- 实用性强，可操作性高
- 语言简洁明了`
          }

          const answerResponse = await openai.chat.completions.create({
            model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: '你是一个知识管理专家，善于整合多个信息源为用户提供有价值的答案。'
              },
              {
                role: 'user',
                content: answerPrompt
              }
            ],
            temperature: 0.3,
            stream: true,
          })

          // 流式发送回答
          for await (const chunk of answerResponse) {
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'answer_content',
                  content: content
                })}\n\n`)
              )
            }
          }

          // 发送完成事件
          console.log('🎯 [Canvas Question] 发送完成事件到前端:', {
            relatedNoteIds: relatedNotes.map((note: any) => note.id),
            notesCount: relatedNotes.length,
            searchStats: {
              totalNotesSearched: knowledgeBase?.length || 0,
              notesFound: relatedNotes.length,
              averageRelevance: relatedNotes.length > 0 
                ? (relatedNotes.reduce((sum: number, note: any) => sum + (note.relevanceScore || 0), 0) / relatedNotes.length).toFixed(2)
                : 0
            },
            timestamp: new Date().toISOString()
          })
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'complete',
              questionId: `q_${Date.now()}`,
              relatedNoteIds: relatedNotes.map((note: any) => note.id),
              searchStats: {
                totalNotesSearched: knowledgeBase?.length || 0,
                notesFound: relatedNotes.length,
                averageRelevance: relatedNotes.length > 0 
                  ? (relatedNotes.reduce((sum: number, note: any) => sum + (note.relevanceScore || 0), 0) / relatedNotes.length).toFixed(2)
                  : 0
              }
            })}\n\n`)
          )

          console.log('✅ [Canvas Question] 画布问题处理完成')

        } catch (error: any) {
          console.error('❌ [Canvas Question] 处理错误:', {
            message: error.message,
            name: error.name,
            stack: error.stack?.slice(0, 200),
            question: question?.slice(0, 50),
            knowledgeBaseSize: knowledgeBase?.length || 0
          })
          
          // 根据错误类型提供不同的错误信息
          let errorMessage = '处理问题时发生错误'
          
          if (error.message?.includes('API key')) {
            errorMessage = 'OpenAI API密钥配置错误，请检查环境变量'
          } else if (error.message?.includes('model')) {
            errorMessage = '模型配置错误，请检查OPENAI_MODEL环境变量'
          } else if (error.message?.includes('timeout')) {
            errorMessage = '请求超时，请稍后重试'
          } else if (error.message?.includes('quota')) {
            errorMessage = 'API配额不足，请检查OpenAI账户余额'
          } else if (error.name === 'AbortError') {
            errorMessage = '请求被取消'
          }
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: errorMessage,
              details: process.env.NODE_ENV === 'development' ? error.message : undefined
            })}\n\n`)
          )
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error: any) {
    console.error('❌ [Canvas Question] API错误:', error)
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    )
  }
}