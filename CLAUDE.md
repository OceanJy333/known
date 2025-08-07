# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 开发命令

### 基本命令
- **开发服务器**: `npm run dev` - 启动 Next.js 开发服务器，端口 3000
- **构建**: `npm run build` - 构建生产版本
- **启动生产服务器**: `npm start` - 运行构建后的生产版本
- **代码检查**: `npm run lint` - 运行 ESLint 代码检查

### 测试
当前项目有部分单元测试文件位于：
- `/src/services/__tests__/` - 服务层测试
- `/src/utils/__tests__/` - 工具函数测试

暂未配置测试运行命令，需要时可添加 Jest 配置。

## 架构概览

### 核心理念
"沉淀" 是一个 AI 驱动的知识管理应用，核心功能是：
1. **智能笔记生成** - 自动将上传的文档转化为结构化笔记
2. **Diff 编辑模式** - 通过 AI 对话生成精确的笔记修改建议
3. **思维画布** - 可视化的知识组织和创作空间

### 技术栈
- **框架**: Next.js 15.3 (App Router)
- **UI**: React 19 + Tailwind CSS + shadcn/ui 组件
- **状态管理**: Zustand
- **AI 集成**: OpenAI API (流式响应)
- **Markdown**: react-markdown + 自定义渲染器

### 目录结构
```
src/
├── app/                # Next.js App Router
│   ├── api/           # API 路由 (所有 AI 相关接口)
│   ├── page.tsx       # 主页面
│   └── layout.tsx     # 根布局
├── components/        # React 组件
│   ├── thinking-mode/ # 思维模式相关组件
│   │   ├── canvas/   # 画布组件
│   │   └── notes-sidebar/ # 笔记侧边栏
│   └── [其他组件]    # Diff、聊天、文件上传等
├── services/         # 业务逻辑层
├── lib/             # 工具库和配置
│   └── prompts.ts   # AI 提示词集中管理
├── types/           # TypeScript 类型定义
└── utils/           # 工具函数
```

### 关键 API 路由

1. **`/api/agent-chat-stream`** - Agent 模式聊天
   - 支持流式响应和 Diff 生成
   - 使用 `<replace_in_notes>` 工具修改笔记

2. **`/api/canvas-question-stream`** - 画布问答
   - 智能召回相关笔记
   - 生成结构化回答

3. **`/api/generate-notes-stream`** - 笔记生成
   - 将原始文档转换为结构化 Markdown

4. **`/api/svg-card-stream`** - SVG 卡片生成
   - 支持多种模板的知识卡片生成

### 核心组件交互流程

1. **文档处理流程**:
   ```
   FileUpload → analyze-stream → generate-notes-stream → StructuredNotes
   ```

2. **Agent 对话流程**:
   ```
   FloatingChat → agent-chat-stream → StreamingDiffDetector → DiffCard
   ```

3. **画布交互流程**:
   ```
   CanvasArea → canvasStore → QuestionNode/OutputNode → 连接线可视化
   ```

### 状态管理

- **全局状态**: 使用 Zustand 管理
  - `canvasStore` - 画布状态（卡片、节点、连接线）
  - `useDiffManager` - Diff 编辑状态
  - `useTabs` - 标签页状态

### AI 提示词管理

所有 AI 提示词集中在 `/src/lib/prompts.ts`：
- `AGENT_CHAT_PROMPT` - Agent 模式系统提示词
- `STRUCTURED_NOTES_PROMPT` - 结构化笔记生成提示词
- `DOCUMENT_ANALYSIS_PROMPTS` - 文档分析提示词

### 环境变量

必需的环境变量（在 `.env.local` 中配置）：
```
OPENAI_API_KEY=你的API密钥
OPENAI_MODEL=gpt-4o-mini (或其他模型)
OPENAI_API_BASE_URL=https://api.openai.com/v1 (可选)
```

### 开发注意事项

1. **流式响应处理**: 所有 AI 接口都使用 Server-Sent Events (SSE) 实现流式输出
2. **Diff 格式**: 使用 `SEARCH/REPLACE` 格式，确保精确匹配
3. **错误处理**: AI 接口需要处理超时、断连等异常情况
4. **性能优化**: 画布使用虚拟化渲染，批量操作优化

### 代码风格

- 使用 TypeScript 严格模式
- 组件使用函数式组件 + Hooks
- 异步操作使用 async/await
- 错误边界和加载状态处理