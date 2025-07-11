# **沉淀：AI 记忆沉淀器 · 产品需求文档 (PRD)**

---

**文档版本**: v1.0
**更新日期**: 2025-07-02

## 1. 产品概述

### 1.1. **产品定位**

**沉淀**是一款为**信息焦虑者**设计的**AI 记忆沉淀器**。它旨在通过自动化的知识处理和富有情感价值的交互体验，帮助用户轻松地收集、组织和再利用信息，从而获得「**知识心安感**」。产品的核心哲学是**“记录的过程 × 拥有的感觉 > 回顾的结果”**。

### 1.2. **目标用户**

- **信息焦虑者**: 渴望保存大量信息，但对繁琐的手动整理感到疲惫的用户。
- **知识工作者**: 需要频繁处理和再创造内容的研究员、分析师、内容创作者等。
- **终身学习者**: 希望建立个人知识体系，但不愿被工具束缚的学习爱好者。

### 1.3. **核心差异化**

| **维度** | **沉淀 (Chen Dian)** | **传统笔记 (Notion, Obsidian)** | **AI 阅读助手 (NotebookLM)** |
| :--- | :--- | :--- | :--- |
| **知识组织** | 全局、多维索引的卡片式知识库，知识可自由流动与重组。 | 手动维护的层级或链接结构，整理负担重。 | 以独立的笔记本为单位，知识存在孤岛效应。 |
| **AI 能力** | **核心驱动力**：自动化结构化、语义召回、多模态内容生成。 | **辅助功能**：多为写作助手或简单的问答。 | **核心功能**：基于 RAG 的问答，但跨笔记本联动能力弱。 |
| **用户角色** | **信息收藏家与创造者**：享受拥有和再利用知识的乐趣。 | **知识苦行僧**：投入大量精力进行手动整理和维护。 | **AI 辅助阅读者**：主要用于理解和消化单篇文档。 |

---

## 2. 产品功能需求

### 2.1. **核心流程：收集 → 沉淀 → 召回 → 加工 → 输出**

#### **Phase 1: 收集与沉淀 (MVP)**

**目标**: 实现无缝的信息捕捉和自动化的初步处理。

- **FRD-101: 文件上传与解析**
  - **描述**: 用户可以通过拖拽或文件选择器上传本地文件（如 `.md`, `.txt`, `.pdf`）。
  - **实现分析**: `FileUpload.tsx` 组件已存在，可作为基础。后端需要能够接收文件并进行初步解析。
  - **AI 能力**: 调用 `analyze-stream` API (`/src/app/api/analyze-stream/route.ts`) 对上传的文档内容进行流式分析。

- **FRD-102: AI 自动生成结构化笔记**
  - **描述**: 文件上传并分析后，系统自动调用 AI 生成一份结构化的 Markdown 笔记。
  - **实现分析**: `generate-notes-stream` API (`/src/app/api/generate-notes-stream/route.ts`) 和 `STRUCTURED_NOTES_PROMPT` (`/src/lib/prompts.ts`) 已为此功能设计。前端需要一个界面来展示生成的笔记，`StructuredNotes.tsx` 和 `MarkdownRenderer.tsx` 可用于此目的。

- **FRD-103: 对话式 AI 聊天 (Agent 模式)**
  - **描述**: 用户可以与 AI 进行对话。在 “Agent” 模式下，AI 能够主动分析对话内容，并生成对结构化笔记的修改建议。
  - **实现分析**: `FloatingChat.tsx` 是此功能的核心 UI。后端逻辑由 `agent-chat-stream` API (`/src/app/api/agent-chat-stream/route.ts`) 驱动，其核心 Prompt (`AGENT_CHAT_PROMPT`) 明确指示 AI 使用 `<replace_in_notes>` 工具来建议修改。

- **FRD-104: Diff 差异化修改建议**
  - **描述**: AI 生成的修改建议以 “Diff” 的形式呈现给用户，用户可以一键接受或拒绝修改。
  - **实现分析**: `DiffCard.tsx`, `DiffInlineRenderer.tsx`, `DiffPreview.tsx` 等一系列 `Diff` 相关组件表明该功能已有坚实的前端基础。`agent-chat-stream` API 的后端逻辑已经实现了从 AI 响应中解析 `SEARCH/REPLACE` 块并作为 `diff` 事件流式返回。

#### **Phase 2: 召回与画布 (V1.1)**

**目标**: 将静态的知识库转变为动态的、可交互的创作空间。

- **FRD-201: 全局知识库与多维索引**
  - **描述**: 所有沉淀的笔记都存入一个非文件夹结构的全局知识库中。用户可以通过标签、时间、内容类型和全文模糊搜索来筛选和查找卡片。

- **FRD-202: 任务画布**
  - **描述**: 用户的每个问题或任务都会创建一个新的空白画布。画布是知识重组和内容创作的中心。

- **FRD-203: 智能卡片召回与可视化**
  - **描述**: 当用户在画布中与 AI 对话时，系统自动从全局知识库中检索相关的知识卡片，并将它们显示在画布上。AI 的回答和被引用的卡片之间会自动建立可视化连线。

#### **Phase 3: 加工与输出 (V1.2)**

**目标**: 赋予用户将零散知识组合成结构化作品的能力。

- **FRD-301: 多模态输出节点**
  - **描述**: 画布中支持添加不同类型的“输出节点”，例如“PPT 节点”、“博客文章节点”、“小红书图文节点”等。

- **FRD-302: 拖拽式内容生成**
  - **描述**: 用户可以将知识卡片拖拽到输出节点上，并提供简单的指令（如“风格活泼一点”），节点会自动根据预设的模板和指令生成相应格式的内容。

- **FRD-303: 内容导出**
  - **描述**: 生成的内容可以被导出为相应的文件格式（如 `.pptx`, `.md`, `.png`）或直接保存回知识库中成为一张新的知识卡片。

---

## 3. AI 原生交互设计亮点

- **AI-Powered Diff Editing**: 借鉴 Cursor IDE 的 Agent 模式，用户通过自然语言对话驱动 AI 生成精确的 `diff` 来修改笔记，免去手动编辑的繁琐。
- **Contextual Card Recall**: AI 对话能自动从知识库中提取上下文相关的知识卡片，并通过可视化连线展示其与当前回答的逻辑关系，让知识的脉络一目了然。
- **In-Context Q&A**: 用户可以在原始文档或结构化笔记中选中任意文本片段，进行局部的、聚焦的问答或内容重写。
- **Generative Output Nodes**: 将复杂的创作过程简化为“拖入卡片 → 指令微调 → 生成内容”的模块化、可交互流程，极大地降低了内容创作的门槛。

---

## 4. 非功能性需求

- **NFR-01: 性能**: 确保大文件上传和分析的流畅性，流式响应必须及时反馈，避免用户等待。
- **NFR-02: 易用性**: 交互流程必须直观、简洁，符合“情绪价值产品”的定位，避免给用户增加学习负担。
- **NFR-03: 隐私与安全**: 用户的知识库数据必须得到妥善保护，API 密钥等敏感信息需在后端安全存储。
- **NFR-04: 可扩展性**: 系统架构应支持未来轻松添加新的内容来源（如浏览器插件、微信公众号）和新的输出节点类型。
