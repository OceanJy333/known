// 模拟知识库数据

import { KnowledgeNote, KnowledgeTag, KnowledgeCategory, KnowledgeStats, SaveRecord } from '@/types/knowledge'

// 模拟标签数据
export const mockTags: KnowledgeTag[] = [
  {
    id: 'tag-1',
    name: 'AI产品设计',
    color: '#3b82f6',
    description: '关于AI产品设计的理论和实践',
    noteCount: 8,
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'tag-2',
    name: '用户体验',
    color: '#10b981',
    description: '用户体验设计相关内容',
    noteCount: 12,
    createdAt: new Date('2024-01-20')
  },
  {
    id: 'tag-3',
    name: '产品策略',
    color: '#f59e0b',
    description: '产品策略和商业模式',
    noteCount: 6,
    createdAt: new Date('2024-01-25')
  },
  {
    id: 'tag-4',
    name: '技术架构',
    color: '#8b5cf6',
    description: '技术架构和系统设计',
    noteCount: 9,
    createdAt: new Date('2024-02-01')
  },
  {
    id: 'tag-5',
    name: '数据科学',
    color: '#ef4444',
    description: '数据科学和机器学习',
    noteCount: 7,
    createdAt: new Date('2024-02-05')
  },
  {
    id: 'tag-6',
    name: '团队管理',
    color: '#06b6d4',
    description: '团队管理和领导力',
    noteCount: 5,
    createdAt: new Date('2024-02-10')
  },
  {
    id: 'tag-7',
    name: '市场分析',
    color: '#84cc16',
    description: '市场分析和竞争研究',
    noteCount: 4,
    createdAt: new Date('2024-02-15')
  },
  {
    id: 'tag-8',
    name: '创新思维',
    color: '#f97316',
    description: '创新思维和方法论',
    noteCount: 6,
    createdAt: new Date('2024-02-20')
  },
  {
    id: 'tag-9',
    name: '方法论',
    color: '#d946ef',
    description: '结构化的思想工具和框架',
    noteCount: 0,
    createdAt: new Date('2024-05-25')
  },
  {
    id: 'tag-10',
    name: '案例分析',
    color: '#84cc16',
    description: '对具体产品、项目或事件的深入剖析',
    noteCount: 0,
    createdAt: new Date('2024-06-02')
  },
  {
    id: 'tag-11',
    name: '工程效率',
    color: '#0ea5e9',
    description: '提升开发团队整体效率的实践',
    noteCount: 0,
    createdAt: new Date('2024-06-10')
  },
  {
    id: 'tag-12',
    name: '增长黑客',
    color: '#f43f5e',
    description: '结合产品、市场、数据和技术的增长方法',
    noteCount: 0,
    createdAt: new Date('2024-06-18')
  },
  {
    id: 'tag-13',
    name: '决策能力',
    color: '#6366f1',
    description: '做出更好决策的心智模型和方法',
    noteCount: 0,
    createdAt: new Date('2024-06-25')
  }
]

// 模拟分类数据
export const mockCategories: KnowledgeCategory[] = [
  {
    id: 'cat-1',
    name: '产品设计',
    description: '产品设计相关的理论、方法和实践',
    color: '#3b82f6',
    icon: 'fas fa-palette',
    noteCount: 15,
    order: 1
  },
  {
    id: 'cat-2',
    name: '技术研发',
    description: '技术架构、开发和工程实践',
    color: '#10b981',
    icon: 'fas fa-code',
    noteCount: 12,
    order: 2
  },
  {
    id: 'cat-3',
    name: '商业分析',
    description: '商业模式、市场分析和策略思考',
    color: '#f59e0b',
    icon: 'fas fa-chart-line',
    noteCount: 8,
    order: 3
  },
  {
    id: 'cat-4',
    name: '个人成长',
    description: '个人发展、学习方法和思维模式',
    color: '#8b5cf6',
    icon: 'fas fa-user-graduate',
    noteCount: 10,
    order: 4
  },
  {
    id: 'cat-5',
    name: '行业洞察',
    description: '行业趋势、案例分析和前沿观察',
    color: '#ef4444',
    icon: 'fas fa-eye',
    noteCount: 7,
    order: 5
  }
]

// 模拟笔记数据
export const mockNotes: KnowledgeNote[] = [
  {
    id: 'note-1',
    title: 'AI产品设计的核心原则',
    content: `# AI产品设计的核心原则

## 1. 以用户为中心
AI产品设计的首要原则是始终以用户为中心。这意味着：
- 深入理解用户的真实需求和痛点
- 设计直观、易用的交互界面
- 让AI能力无缝融入用户的工作流程

## 2. 透明性和可解释性
用户需要理解AI是如何工作的，特别是在关键决策场景中：
- 提供清晰的AI决策理由
- 展示置信度和不确定性
- 让用户能够质疑和修正AI的输出

## 3. 渐进式增强
AI产品应该采用渐进式增强的设计理念：
- 从简单的辅助功能开始
- 逐步增加AI的参与度
- 保持用户的控制权和选择权

## 4. 错误处理和恢复
AI系统不可避免会出错，优秀的产品设计需要：
- 优雅地处理错误情况
- 提供清晰的错误信息
- 让用户能够轻松恢复和重试

## 5. 持续学习和改进
AI产品应该能够从用户反馈中学习：
- 收集用户反馈数据
- 持续优化算法和体验
- 个性化适应用户偏好`,
    summary: '总结了AI产品设计的五大核心原则：以用户为中心、透明性、渐进式增强、错误处理和持续学习。',
    tags: ['tag-1', 'tag-2'],
    category: 'cat-1',
    source: 'upload',
    sourceFile: 'AI产品设计原则.md',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
    wordCount: 280,
    readingTime: 2,
    difficulty: 'medium',
    keyPoints: [
      '以用户为中心是AI产品设计的首要原则',
      '透明性和可解释性对用户信任至关重要',
      '渐进式增强能够降低用户的学习成本',
      '优雅的错误处理提升用户体验',
      '持续学习实现产品的自我优化'
    ],
    relatedNotes: ['note-2', 'note-3'],
    accessCount: 45,
    lastAccessed: new Date('2024-03-15'),
    rating: 5,
    isFavorite: true,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-1-1',
        timestamp: new Date('2024-03-01T09:30:00'),
        type: 'create',
        changeDescription: '创建AI产品设计原则笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 280,
        version: 1
      },
      {
        id: 'save-1-2',
        timestamp: new Date('2024-03-01T14:20:00'),
        type: 'edit',
        changeDescription: '补充错误处理章节',
        changedFields: ['content', 'keyPoints'],
        wordCountDelta: 45,
        version: 2
      },
      {
        id: 'save-1-3',
        timestamp: new Date('2024-03-01T16:45:00'),
        type: 'auto',
        changeDescription: '自动保存标签更新',
        changedFields: ['tags', 'updatedAt'],
        wordCountDelta: 0,
        version: 3
      }
    ]
  },
  {
    id: 'note-2',
    title: '用户体验设计中的认知负荷理论',
    content: `# 用户体验设计中的认知负荷理论

## 什么是认知负荷
认知负荷理论描述了人类大脑在处理信息时的限制。在UX设计中，我们需要考虑三种类型的认知负荷：

### 1. 内在认知负荷（Intrinsic Load）
- 任务本身的复杂性
- 用户需要理解的核心概念
- 无法通过设计简化的固有难度

### 2. 外在认知负荷（Extraneous Load）
- 界面设计造成的额外负担
- 不必要的视觉元素和交互
- 可以通过优化设计来降低

### 3. 相关认知负荷（Germane Load）
- 用户学习和理解的过程
- 建立心理模型的努力
- 有助于长期记忆的形成

## 设计策略

### 减少外在认知负荷
- 简化界面布局
- 使用一致的设计语言
- 减少不必要的装饰元素
- 优化信息架构

### 管理内在认知负荷
- 将复杂任务分解为简单步骤
- 提供渐进式披露
- 使用熟悉的隐喻和模式
- 提供上下文帮助

### 促进相关认知负荷
- 设计有意义的学习路径
- 提供即时反馈
- 鼓励用户探索和实验
- 建立清晰的心理模型`,
    summary: '介绍了认知负荷理论在UX设计中的应用，包括三种认知负荷类型和相应的设计策略。',
    tags: ['tag-2', 'tag-8'],
    category: 'cat-1',
    source: 'manual',
    createdAt: new Date('2024-03-05'),
    updatedAt: new Date('2024-03-05'),
    wordCount: 320,
    readingTime: 3,
    difficulty: 'medium',
    keyPoints: [
      '认知负荷分为内在、外在和相关三种类型',
      '外在认知负荷可以通过优化设计来降低',
      '内在认知负荷需要通过任务分解来管理',
      '相关认知负荷有助于用户学习和理解'
    ],
    relatedNotes: ['note-1', 'note-4'],
    accessCount: 32,
    lastAccessed: new Date('2024-03-12'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-2-1',
        timestamp: new Date('2024-03-05T11:15:00'),
        type: 'create',
        changeDescription: '创建认知负荷理论笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 320,
        version: 1
      },
      {
        id: 'save-2-2',
        timestamp: new Date('2024-03-05T15:30:00'),
        type: 'edit',
        changeDescription: '优化设计策略部分',
        changedFields: ['content', 'summary'],
        wordCountDelta: 25,
        version: 2
      }
    ]
  },
  {
    id: 'note-3',
    title: '产品策略画布：从想法到执行',
    content: `# 产品策略画布：从想法到执行

## 产品策略画布的构成

产品策略画布是一个可视化工具，帮助产品团队系统性地思考和规划产品策略。它包含以下关键要素：

### 1. 目标用户（Target Users）
- 主要用户群体
- 用户画像和需求
- 用户行为模式
- 痛点和期望

### 2. 价值主张（Value Proposition）
- 核心价值承诺
- 差异化优势
- 解决的问题
- 提供的利益

### 3. 产品愿景（Product Vision）
- 长期目标
- 成功标准
- 影响力和意义
- 未来图景

### 4. 市场机会（Market Opportunity）
- 市场规模和增长
- 竞争格局
- 技术趋势
- 监管环境

### 5. 核心功能（Core Features）
- 必备功能
- 差异化功能
- 未来功能
- 功能优先级

### 6. 商业模式（Business Model）
- 收入模式
- 成本结构
- 盈利路径
- 资源需求

### 7. 成功指标（Success Metrics）
- 关键绩效指标
- 用户满意度
- 商业指标
- 产品指标

## 使用方法

### 第一步：用户研究
深入了解目标用户的需求、行为和痛点

### 第二步：价值定位
明确产品的核心价值和差异化优势

### 第三步：市场分析
评估市场机会和竞争环境

### 第四步：功能规划
确定核心功能和产品路线图

### 第五步：商业设计
构建可持续的商业模式

### 第六步：指标定义
建立清晰的成功衡量标准`,
    summary: '详细介绍了产品策略画布的构成要素和使用方法，帮助产品团队系统性地规划产品策略。',
    tags: ['tag-3', 'tag-7'],
    category: 'cat-3',
    source: 'chat',
    createdAt: new Date('2024-03-08'),
    updatedAt: new Date('2024-03-08'),
    wordCount: 420,
    readingTime: 4,
    difficulty: 'hard',
    keyPoints: [
      '产品策略画布包含7个关键要素',
      '从用户研究开始，逐步完善各个要素',
      '需要平衡用户价值和商业价值',
      '清晰的成功指标是关键'
    ],
    relatedNotes: ['note-1', 'note-7'],
    accessCount: 28,
    lastAccessed: new Date('2024-03-14'),
    rating: 5,
    isFavorite: true,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-3-1',
        timestamp: new Date('2024-03-08T08:45:00'),
        type: 'create',
        changeDescription: '从聊天中生成产品策略画布笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 420,
        version: 1
      },
      {
        id: 'save-3-2',
        timestamp: new Date('2024-03-08T13:20:00'),
        type: 'edit',
        changeDescription: '增加使用方法步骤',
        changedFields: ['content', 'keyPoints'],
        wordCountDelta: 80,
        version: 2
      },
      {
        id: 'save-3-3',
        timestamp: new Date('2024-03-08T16:10:00'),
        type: 'edit',
        changeDescription: '标记为收藏',
        changedFields: ['isFavorite'],
        wordCountDelta: 0,
        version: 3
      }
    ]
  },
  {
    id: 'note-4',
    title: '微服务架构的设计模式',
    content: `# 微服务架构的设计模式

## 核心设计模式

### 1. 服务分解模式（Service Decomposition）

#### 按业务能力分解
- 识别业务能力
- 每个服务负责一个业务能力
- 确保服务的高内聚、低耦合

#### 按领域分解
- 使用领域驱动设计（DDD）
- 识别限界上下文
- 每个服务对应一个领域

### 2. 数据管理模式

#### 每服务一个数据库
- 数据私有化
- 避免数据耦合
- 提高独立性

#### 事件驱动架构
- 使用事件进行服务间通信
- 保证最终一致性
- 支持解耦和扩展

### 3. 通信模式

#### 同步通信
- REST API
- GraphQL
- gRPC

#### 异步通信
- 消息队列
- 事件总线
- 发布-订阅模式

### 4. 数据一致性模式

#### Saga模式
- 分布式事务管理
- 补偿操作
- 长时间运行的业务流程

#### CQRS模式
- 命令查询分离
- 读写分离
- 性能优化

### 5. 服务发现模式

#### 客户端发现
- 服务注册表
- 负载均衡
- 健康检查

#### 服务端发现
- API网关
- 负载均衡器
- 路由策略

## 实施考虑

### 技术栈选择
- 语言和框架
- 数据库选择
- 基础设施工具

### 运维管理
- 容器化
- 持续集成/持续部署
- 监控和日志

### 团队组织
- 康威定律
- 跨功能团队
- 责任分工`,
    summary: '全面介绍了微服务架构的主要设计模式，包括服务分解、数据管理、通信、一致性和服务发现等方面。',
    tags: ['tag-4'],
    category: 'cat-2',
    source: 'upload',
    sourceFile: '微服务架构设计.md',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-10'),
    wordCount: 380,
    readingTime: 3,
    difficulty: 'hard',
    keyPoints: [
      '服务分解是微服务架构的基础',
      '每个服务应该有独立的数据库',
      '事件驱动架构支持服务解耦',
      'Saga模式处理分布式事务',
      '服务发现确保服务间通信'
    ],
    relatedNotes: ['note-6', 'note-8'],
    accessCount: 35,
    lastAccessed: new Date('2024-03-16'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-4-1',
        timestamp: new Date('2024-03-10T10:00:00'),
        type: 'create',
        changeDescription: '上传微服务架构设计文档',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 380,
        version: 1
      },
      {
        id: 'save-4-2',
        timestamp: new Date('2024-03-10T14:30:00'),
        type: 'edit',
        changeDescription: '补充实施考虑章节',
        changedFields: ['content'],
        wordCountDelta: 60,
        version: 2
      }
    ]
  },
  {
    id: 'note-5',
    title: '数据科学项目的完整生命周期',
    content: `# 数据科学项目的完整生命周期

## 项目阶段概述

数据科学项目通常遵循CRISP-DM（Cross-Industry Standard Process for Data Mining）方法论，包含以下6个阶段：

### 1. 业务理解（Business Understanding）
- 确定业务目标
- 评估现状
- 确定数据挖掘目标
- 制定项目计划

### 2. 数据理解（Data Understanding）
- 收集初始数据
- 描述数据特征
- 探索数据质量
- 发现数据洞察

### 3. 数据准备（Data Preparation）
- 数据清洗
- 特征工程
- 数据转换
- 数据集成

### 4. 建模（Modeling）
- 选择建模技术
- 构建模型
- 评估模型性能
- 调优参数

### 5. 评估（Evaluation）
- 评估结果
- 审查过程
- 确定下一步行动
- 业务价值评估

### 6. 部署（Deployment）
- 部署计划
- 监控和维护
- 最终报告
- 项目总结

## 关键成功因素

### 跨职能协作
- 业务专家参与
- 技术团队支持
- 管理层承诺
- 用户反馈

### 数据质量
- 数据完整性
- 数据准确性
- 数据时效性
- 数据一致性

### 技术选型
- 适合的工具和平台
- 可扩展的架构
- 易于维护的解决方案
- 成本效益考虑

### 项目管理
- 明确的里程碑
- 风险管理
- 资源分配
- 时间管理

## 常见挑战与解决方案

### 数据质量问题
- 建立数据质量标准
- 实施数据验证流程
- 定期数据审计
- 数据血缘追踪

### 模型性能不佳
- 增加数据量
- 改进特征工程
- 尝试不同算法
- 调优超参数

### 业务价值不明确
- 明确业务目标
- 定义成功指标
- 持续沟通
- 价值验证

### 部署和维护困难
- 自动化部署
- 模型监控
- 版本控制
- 文档管理`,
    summary: '详细描述了数据科学项目的完整生命周期，包括CRISP-DM方法论的六个阶段和关键成功因素。',
    tags: ['tag-5', 'tag-6'],
    category: 'cat-2',
    source: 'manual',
    createdAt: new Date('2024-03-12'),
    updatedAt: new Date('2024-03-12'),
    wordCount: 480,
    readingTime: 4,
    difficulty: 'medium',
    keyPoints: [
      'CRISP-DM包含6个核心阶段',
      '跨职能协作是项目成功的关键',
      '数据质量直接影响项目效果',
      '部署和维护同样重要',
      '持续的业务价值验证必不可少'
    ],
    relatedNotes: ['note-4', 'note-9'],
    accessCount: 22,
    lastAccessed: new Date('2024-03-18'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-5-1',
        timestamp: new Date('2024-03-12T09:20:00'),
        type: 'create',
        changeDescription: '手动创建数据科学生命周期笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 480,
        version: 1
      },
      {
        id: 'save-5-2',
        timestamp: new Date('2024-03-12T12:15:00'),
        type: 'edit',
        changeDescription: '完善挑战与解决方案部分',
        changedFields: ['content', 'keyPoints'],
        wordCountDelta: 120,
        version: 2
      },
      {
        id: 'save-5-3',
        timestamp: new Date('2024-03-12T17:45:00'),
        type: 'auto',
        changeDescription: '自动保存相关笔记链接更新',
        changedFields: ['relatedNotes', 'updatedAt'],
        wordCountDelta: 0,
        version: 3
      }
    ]
  },
  {
    id: 'note-6',
    title: '敏捷开发中的用户故事编写技巧',
    content: `# 敏捷开发中的用户故事编写技巧

## 什么是用户故事

用户故事是敏捷开发中描述功能需求的简洁方式。一个好的用户故事应该遵循INVEST原则：

### INVEST原则
- **Independent（独立的）**：故事之间应该尽量独立
- **Negotiable（可协商的）**：细节可以在开发过程中讨论
- **Valuable（有价值的）**：对用户或业务有明确价值
- **Estimatable（可估算的）**：团队能够估算开发工作量
- **Small（小的）**：足够小，能在一个迭代内完成
- **Testable（可测试的）**：有明确的验收标准

## 编写模板

### 基本模板
作为 [用户角色]，我希望 [功能描述]，以便 [价值/目标]。

### 扩展模板
**标题**：[简洁的功能描述]
**作为**：[用户角色]
**我希望**：[具体功能]
**以便**：[实现的价值]
**验收标准**：
- [ ] 条件1
- [ ] 条件2
- [ ] 条件3

## 编写技巧

### 1. 关注用户价值
每个故事都应该明确回答"为什么"这个问题。

### 2. 使用真实的用户角色
基于用户研究创建具体的用户画像。

### 3. 保持简洁明了
避免技术细节，专注于用户需求。

### 4. 定义明确的验收标准
确保开发团队和产品所有者对"完成"有统一理解。

## 常见错误

### 技术导向
❌ 作为开发者，我需要创建一个API端点...
✅ 作为用户，我希望能够快速搜索产品...

### 过于宽泛
❌ 作为用户，我希望有一个好的体验...
✅ 作为新用户，我希望能在3步内完成注册...

### 缺乏验收标准
❌ 实现登录功能
✅ 用户登录功能，包含邮箱验证、密码检查、错误提示等明确标准`,
    summary: '详细介绍了敏捷开发中用户故事的编写方法，包括INVEST原则、模板和常见错误。',
    tags: ['tag-3', 'tag-6'],
    category: 'cat-2',
    source: 'manual',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-15'),
    wordCount: 350,
    readingTime: 3,
    difficulty: 'medium',
    keyPoints: [
      'INVEST原则是编写用户故事的基础',
      '关注用户价值而非技术实现',
      '明确的验收标准至关重要',
      '避免技术导向的描述方式'
    ],
    relatedNotes: ['note-3', 'note-5'],
    accessCount: 18,
    lastAccessed: new Date('2024-03-20'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-6-1',
        timestamp: new Date('2024-03-15T10:30:00'),
        type: 'create',
        changeDescription: '创建用户故事编写技巧笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 350,
        version: 1
      }
    ]
  },
  {
    id: 'note-7',
    title: '设计系统的构建与维护',
    content: `# 设计系统的构建与维护

## 设计系统的价值

### 对设计师
- 提高设计效率
- 保证设计一致性
- 减少重复工作
- 专注创新而非重复

### 对开发者
- 加速开发进程
- 减少实现歧义
- 提高代码复用
- 降低维护成本

### 对产品
- 统一用户体验
- 提升品牌认知
- 降低学习成本
- 加快产品迭代

## 构建步骤

### 1. 审计现有设计
- 收集所有界面和组件
- 分析不一致的地方
- 识别可复用的元素
- 评估设计债务

### 2. 定义设计原则
- 品牌价值观
- 设计哲学
- 交互原则
- 视觉风格

### 3. 建立视觉基础
- 颜色系统
- 字体系统
- 间距规范
- 图标系统

### 4. 创建组件库
- 基础组件（按钮、输入框等）
- 复合组件（卡片、表单等）
- 模式组件（导航、布局等）
- 页面模板

### 5. 编写文档
- 使用指南
- 设计规范
- 代码示例
- 最佳实践

## 维护策略

### 版本管理
- 语义化版本控制
- 变更日志
- 迁移指南
- 废弃通知

### 治理流程
- 贡献流程
- 审查机制
- 决策流程
- 反馈收集

### 推广应用
- 培训计划
- 工具支持
- 社区建设
- 成功案例

## 常见挑战

### 组织挑战
- 跨团队协作
- 资源投入
- 优先级平衡
- 文化变革

### 技术挑战
- 技术栈差异
- 性能影响
- 可定制性
- 向后兼容

### 维护挑战
- 保持更新
- 质量控制
- 文档同步
- 用户支持`,
    summary: '全面介绍了设计系统的价值、构建步骤、维护策略和常见挑战。',
    tags: ['tag-2', 'tag-4'],
    category: 'cat-1',
    source: 'chat',
    createdAt: new Date('2024-03-18'),
    updatedAt: new Date('2024-03-18'),
    wordCount: 420,
    readingTime: 4,
    difficulty: 'medium',
    keyPoints: [
      '设计系统提高效率和一致性',
      '构建需要系统性的方法',
      '维护需要明确的治理流程',
      '推广应用同样重要'
    ],
    relatedNotes: ['note-2', 'note-4'],
    accessCount: 25,
    lastAccessed: new Date('2024-03-22'),
    rating: 5,
    isFavorite: true,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-7-1',
        timestamp: new Date('2024-03-18T14:15:00'),
        type: 'create',
        changeDescription: '从聊天中生成设计系统笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 420,
        version: 1
      }
    ]
  },
  {
    id: 'note-8',
    title: '机器学习模型的部署策略',
    content: `# 机器学习模型的部署策略

## 部署模式分类

### 1. 批量预测
- 离线处理大量数据
- 定期更新预测结果
- 适用于非实时场景
- 成本效益高

### 2. 在线预测
- 实时响应用户请求
- 低延迟要求
- 高可用性需求
- 资源消耗较大

### 3. 边缘计算
- 设备端本地推理
- 隐私保护
- 离线可用
- 硬件限制

## 部署架构选择

### 微服务架构
- 模型独立部署
- 易于扩展和维护
- 技术栈灵活
- 复杂度较高

### 容器化部署
- 环境一致性
- 快速扩缩容
- 资源隔离
- 编排管理

### 无服务器架构
- 按需付费
- 自动扩缩容
- 运维简化
- 冷启动延迟

## 模型服务化

### API设计
- RESTful风格
- 版本控制
- 错误处理
- 文档完善

### 数据处理
- 输入验证
- 特征预处理
- 输出后处理
- 格式转换

### 性能优化
- 模型量化
- 缓存策略
- 批处理
- 异步处理

## 监控与维护

### 性能监控
- 响应时间
- 吞吐量
- 错误率
- 资源使用

### 模型监控
- 数据漂移
- 概念漂移
- 预测质量
- 业务指标

### 运维管理
- 自动重启
- 健康检查
- 日志管理
- 告警机制

## A/B测试与灰度发布

### 渐进式部署
- 灰度用户
- 流量分割
- 风险控制
- 快速回滚

### 性能对比
- 指标对比
- 统计显著性
- 业务影响
- 决策支持

## 安全考虑

### 模型安全
- 模型加密
- 访问控制
- 输入验证
- 对抗攻击防护

### 数据安全
- 数据脱敏
- 传输加密
- 存储安全
- 审计跟踪`,
    summary: '详细介绍了机器学习模型的各种部署策略，包括部署模式、架构选择、监控维护等。',
    tags: ['tag-5', 'tag-4'],
    category: 'cat-2',
    source: 'upload',
    sourceFile: 'ML模型部署策略.pdf',
    createdAt: new Date('2024-03-20'),
    updatedAt: new Date('2024-03-20'),
    wordCount: 460,
    readingTime: 4,
    difficulty: 'hard',
    keyPoints: [
      '选择合适的部署模式至关重要',
      '架构选择影响扩展性和维护性',
      '监控是确保模型稳定的关键',
      'A/B测试支持科学决策',
      '安全考虑不可忽视'
    ],
    relatedNotes: ['note-4', 'note-5'],
    accessCount: 31,
    lastAccessed: new Date('2024-03-25'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-8-1',
        timestamp: new Date('2024-03-20T09:45:00'),
        type: 'create',
        changeDescription: '上传ML模型部署策略PDF',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 460,
        version: 1
      }
    ]
  },
  {
    id: 'note-9',
    title: '产品创新的双钻石模型',
    content: `# 产品创新的双钻石模型

## 模型概述

双钻石模型由英国设计委员会提出，描述了创新过程的四个阶段：发现、定义、开发、交付。每个钻石代表一个思维过程：发散思维和收敛思维的交替。

## 第一个钻石：发现正确的问题

### 发现阶段（Discover）
**目标**：理解用户和市场需求

**活动**：
- 用户研究和访谈
- 市场调研
- 竞品分析
- 趋势观察
- 利益相关者访谈

**产出**：
- 用户洞察
- 市场机会
- 问题清单
- 研究报告

### 定义阶段（Define）
**目标**：明确要解决的核心问题

**活动**：
- 问题优先级排序
- 用户画像创建
- 问题陈述定义
- 成功指标设定
- 约束条件识别

**产出**：
- 明确的问题陈述
- 设计挑战
- 成功标准
- 项目范围

## 第二个钻石：找到正确的解决方案

### 开发阶段（Develop）
**目标**：探索和开发解决方案

**活动**：
- 头脑风暴
- 概念设计
- 原型制作
- 用户测试
- 迭代优化

**产出**：
- 创意方案
- 原型产品
- 测试结果
- 优化建议

### 交付阶段（Deliver）
**目标**：实现和推出最终解决方案

**活动**：
- 最终设计确定
- 开发实现
- 质量测试
- 上线部署
- 效果评估

**产出**：
- 最终产品
- 部署计划
- 性能数据
- 反馈收集

## 应用技巧

### 保持发散-收敛节奏
- 发散阶段：开放思维，广泛探索
- 收敛阶段：理性分析，聚焦重点
- 避免过早收敛或持续发散

### 用户中心思维
- 始终以用户需求为导向
- 定期进行用户验证
- 关注用户体验全流程

### 跨功能协作
- 多学科团队参与
- 不同视角的碰撞
- 共同决策机制

### 迭代验证
- 小步快跑
- 快速原型
- 持续反馈
- 及时调整

## 常见误区

### 线性思维
误以为创新是线性过程，忽视迭代的重要性。

### 解决方案偏见
过早锁定解决方案，缺乏充分的问题探索。

### 内部视角
过度依赖内部观点，缺乏外部用户验证。

### 完美主义
追求完美解决方案，延迟市场验证时机。`,
    summary: '介绍了产品创新的双钻石模型，包括发现、定义、开发、交付四个阶段的具体方法。',
    tags: ['tag-8', 'tag-1'],
    category: 'cat-1',
    source: 'manual',
    createdAt: new Date('2024-03-22'),
    updatedAt: new Date('2024-03-22'),
    wordCount: 520,
    readingTime: 4,
    difficulty: 'medium',
    keyPoints: [
      '双钻石模型包含四个关键阶段',
      '发散-收敛思维的交替应用',
      '用户中心和迭代验证是核心',
      '避免线性思维和解决方案偏见'
    ],
    relatedNotes: ['note-1', 'note-3'],
    accessCount: 19,
    lastAccessed: new Date('2024-03-28'),
    rating: 5,
    isFavorite: true,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-9-1',
        timestamp: new Date('2024-03-22T11:20:00'),
        type: 'create',
        changeDescription: '手动创建双钻石模型笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 520,
        version: 1
      }
    ]
  },
  {
    id: 'note-10',
    title: '团队协作中的心理安全感',
    content: `# 团队协作中的心理安全感

## 定义与重要性

心理安全感是指团队成员相信可以在不担心负面后果的情况下表达想法、承认错误、提出问题或担忧。这是高效团队的基础特征。

### 谷歌Project Aristotle发现
谷歌通过研究180个团队发现，心理安全感是高效团队最重要的特征，比个人能力更重要。

## 心理安全感的表现

### 积极表现
- 主动分享想法和建议
- 承认错误并从中学习
- 提出具有挑战性的问题
- 表达不同观点
- 寻求帮助和反馈
- 冒险尝试新方法

### 缺失表现
- 保持沉默避免风险
- 隐瞒错误或问题
- 只说领导想听的话
- 避免承担责任
- 缺乏创新和试验
- 团队内部政治化

## 建立心理安全感的方法

### 领导者行为

#### 1. 展示脆弱性
- 承认自己的错误
- 分享学习经历
- 寻求团队的帮助
- 表达不确定性

#### 2. 积极倾听
- 全神贯注地听取意见
- 避免打断他人发言
- 询问澄清性问题
- 总结和确认理解

#### 3. 建设性反馈
- 及时给予反馈
- 专注于行为而非人格
- 提供改进建议
- 认可好的表现

#### 4. 鼓励发声
- 主动征求意见
- 留出思考时间
- 重视不同观点
- 保护发言者

### 团队实践

#### 1. 制定团队规范
- 明确沟通原则
- 建立决策流程
- 设定行为期望
- 定义成功标准

#### 2. 定期回顾
- 项目复盘会议
- 团队健康检查
- 流程改进讨论
- 关系质量评估

#### 3. 失败庆祝
- 将失败视为学习机会
- 分享失败经验
- 表彰勇于尝试的行为
- 建立实验文化

#### 4. 多样性包容
- 重视不同背景
- 鼓励多元观点
- 避免群体思维
- 创造平等发言机会

## 衡量心理安全感

### Edmondson量表
Amy Edmondson开发的7题量表：

1. 如果你在团队中犯错，是否经常被指责？
2. 团队成员能否提出困难的问题和敏感话题？
3. 团队成员是否因为与众不同而被排斥？
4. 在团队中冒险是否安全？
5. 向团队成员寻求帮助是否困难？
6. 团队成员是否故意破坏他人努力？
7. 团队成员的技能和才能是否被重视和利用？

### 观察指标
- 会议参与度
- 提问频率
- 异议表达
- 错误报告率
- 创新提案数量
- 团队满意度

## 常见阻碍

### 文化因素
- 权力距离较大
- 完美主义文化
- 竞争导向
- 面子文化

### 结构因素
- 等级制度严格
- 考核机制单一
- 信息不透明
- 资源稀缺

### 个人因素
- 自我保护本能
- 过往负面经历
- 性格特质差异
- 技能信心不足`,
    summary: '深入分析了团队协作中心理安全感的重要性、表现、建立方法和衡量标准。',
    tags: ['tag-6', 'tag-8'],
    category: 'cat-4',
    source: 'upload',
    sourceFile: '心理安全感研究报告.docx',
    createdAt: new Date('2024-03-25'),
    updatedAt: new Date('2024-03-25'),
    wordCount: 680,
    readingTime: 5,
    difficulty: 'medium',
    keyPoints: [
      '心理安全感是高效团队的基础',
      '领导者的行为示范至关重要',
      '需要建立明确的团队规范',
      '失败应被视为学习机会',
      '可通过具体指标衡量'
    ],
    relatedNotes: ['note-6'],
    accessCount: 23,
    lastAccessed: new Date('2024-03-30'),
    rating: 5,
    isFavorite: true,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-10-1',
        timestamp: new Date('2024-03-25T15:30:00'),
        type: 'create',
        changeDescription: '上传心理安全感研究报告',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 680,
        version: 1
      }
    ]
  },
  {
    id: 'note-11',
    title: 'API设计的最佳实践',
    content: `# API设计的最佳实践

## 设计原则

### 1. 简单性（Simplicity）
- 直观的命名约定
- 清晰的URL结构
- 最小化复杂性
- 易于理解和使用

### 2. 一致性（Consistency）
- 统一的命名规范
- 一致的响应格式
- 标准化的错误处理
- 相同的认证机制

### 3. 可预测性（Predictability）
- 遵循标准约定
- 明确的行为期望
- 统一的状态码使用
- 清晰的文档说明

## RESTful设计

### 资源标识
使用名词而非动词，复数形式命名集合，层次化的URL结构，避免深层嵌套。

### HTTP方法使用
- GET：读取资源
- POST：创建资源
- PUT：完整更新资源
- PATCH：部分更新资源
- DELETE：删除资源

### 状态码规范
- 200：成功
- 201：创建成功
- 204：无内容
- 400：客户端错误
- 401：未授权
- 404：资源不存在
- 500：服务器错误

## 版本控制

### URL版本控制
/api/v1/users
/api/v2/users

### 向后兼容
- 新增字段不影响旧版本
- 废弃字段逐步移除
- 提供迁移指南
- 版本生命周期管理

## 认证与授权

### 认证方式
- JWT Token
- OAuth 2.0
- API Key
- Basic Auth

### 安全考虑
- HTTPS强制使用
- 输入验证
- 速率限制
- 日志记录`,
    summary: '全面介绍了API设计的最佳实践，包括RESTful设计、数据格式、错误处理、版本控制等。',
    tags: ['tag-4', 'tag-2'],
    category: 'cat-2',
    source: 'manual',
    createdAt: new Date('2024-03-28'),
    updatedAt: new Date('2024-03-28'),
    wordCount: 580,
    readingTime: 5,
    difficulty: 'medium',
    keyPoints: [
      'API设计需遵循简单性、一致性、可预测性原则',
      'RESTful设计是主流标准',
      '统一的错误处理格式很重要',
      '版本控制和向后兼容需提前规划',
      '安全和性能是必要考虑'
    ],
    relatedNotes: ['note-4', 'note-8'],
    accessCount: 27,
    lastAccessed: new Date('2024-04-02'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-11-1',
        timestamp: new Date('2024-03-28T13:45:00'),
        type: 'create',
        changeDescription: '手动创建API设计最佳实践笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 580,
        version: 1
      }
    ]
  },
  {
    id: 'note-12',
    title: '竞品分析的系统方法论',
    content: `# 竞品分析的系统方法论

## 分析框架

### 1. 分析目标设定
- 明确分析目的
- 确定关键问题
- 设定成功标准
- 定义时间范围

### 2. 竞品识别与分类

#### 直接竞争对手
- 相同目标用户
- 类似产品功能
- 相似商业模式
- 同等价格区间

#### 间接竞争对手
- 解决相同问题
- 不同解决方案
- 替代性产品
- 上下游产品

#### 潜在竞争对手
- 市场新进入者
- 技术变革带来的威胁
- 跨界竞争者
- 未来可能的竞争

## 分析维度

### 产品层面

#### 功能对比
- 核心功能覆盖
- 特色功能差异
- 功能完整度
- 更新频率

#### 用户体验
- 界面设计
- 交互流程
- 响应速度
- 易用性

#### 技术架构
- 技术选型
- 性能表现
- 安全性
- 可扩展性

### 商业层面

#### 商业模式
- 收入来源
- 成本结构
- 价值主张
- 客户关系

#### 市场定位
- 目标用户群体
- 市场细分
- 差异化策略
- 品牌定位

#### 运营策略
- 营销渠道
- 获客成本
- 留存策略
- 增长策略

## 分析方法

### 桌面研究
- 公开信息收集
- 新闻报道分析
- 财务报表研究
- 专利技术分析

### 产品体验
- 注册使用流程
- 功能深度体验
- 性能测试
- 用户反馈收集

### 用户调研
- 用户访谈
- 问卷调查
- 焦点小组
- 用户行为分析

### 第三方数据
- 市场研究报告
- 行业分析
- 用户行为数据
- 流量分析工具

## 分析工具

### SWOT分析
- 优势（Strengths）
- 劣势（Weaknesses）
- 机会（Opportunities）
- 威胁（Threats）

### 波特五力模型
- 供应商议价能力
- 购买者议价能力
- 新进入者威胁
- 替代品威胁
- 行业内竞争

### 商业模式画布
- 价值主张
- 客户细分
- 渠道通路
- 客户关系
- 收入来源

## 输出与应用

### 分析报告结构
1. 执行摘要
2. 市场概况
3. 竞品概述
4. 详细分析
5. 对比总结
6. 机会识别
7. 策略建议

### 应用场景
- 产品规划
- 市场定位
- 功能优先级
- 定价策略
- 营销策略
- 投资决策

### 持续监控
- 定期更新分析
- 关键指标跟踪
- 市场变化监测
- 策略调整建议`,
    summary: '系统介绍了竞品分析的方法论，包括分析框架、维度、方法、工具和应用。',
    tags: ['tag-7', 'tag-3'],
    category: 'cat-3',
    source: 'chat',
    createdAt: new Date('2024-03-30'),
    updatedAt: new Date('2024-03-30'),
    wordCount: 720,
    readingTime: 6,
    difficulty: 'medium',
    keyPoints: [
      '竞品分析需要系统性的框架和方法',
      '从产品、商业、资源三个层面进行分析',
      '结合多种分析工具和方法',
      '输出要具有可操作性',
      '保持客观性和合规性'
    ],
    relatedNotes: ['note-3', 'note-9'],
    accessCount: 16,
    lastAccessed: new Date('2024-04-05'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-12-1',
        timestamp: new Date('2024-03-30T16:20:00'),
        type: 'create',
        changeDescription: '从聊天中生成竞品分析方法论笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 720,
        version: 1
      }
    ]
  },
  {
    id: 'note-13',
    title: '个人知识管理体系构建',
    content: `# 个人知识管理体系构建

## 知识管理的重要性

在信息爆炸的时代，个人知识管理（PKM）已成为提升竞争力的关键能力。有效的知识管理可以：

- 提高学习效率
- 增强创新能力
- 改善决策质量
- 积累专业优势
- 形成个人品牌

## 知识分类体系

### 按知识类型分类

#### 事实性知识（What）
- 概念定义
- 历史事件
- 统计数据
- 人物信息

#### 程序性知识（How）
- 操作步骤
- 方法技巧
- 最佳实践
- 经验总结

#### 原理性知识（Why）
- 理论基础
- 因果关系
- 规律法则
- 思维模型

### 按来源渠道分类

#### 正式学习
- 课程学习
- 书籍阅读
- 培训参与
- 会议研讨

#### 非正式学习
- 日常观察
- 交流讨论
- 实践体验
- 反思总结

#### 社交学习
- 同事分享
- 专家访谈
- 社区交流
- 师父传授

## 知识获取策略

### 主动获取

#### 目标导向学习
- 明确学习目标
- 制定学习计划
- 选择合适资源
- 持续跟踪进展

#### 系统性学习
- 构建知识地图
- 由浅入深学习
- 建立知识联系
- 形成完整体系

### 被动获取

#### 环境设置
- 信息源订阅
- 推荐算法优化
- 社交网络建设
- 学习氛围营造

#### 机会抓取
- 保持开放心态
- 培养好奇心
- 敏感信息捕捉
- 及时记录想法

## 知识组织方法

### 分类整理

#### 主题分类法
- 按专业领域
- 按项目类型
- 按重要程度
- 按使用频率

#### 标签系统
- 多维度标签
- 层次化标签
- 动态标签
- 关联标签

### 关联建立

#### 概念图谱
- 核心概念识别
- 关系类型定义
- 连接强度标注
- 网络结构优化

#### 知识链接
- 相似性链接
- 因果性链接
- 时间性链接
- 层次性链接

## 知识存储工具

### 数字化工具

#### 笔记软件
- Notion：结构化强
- Obsidian：关联性好
- Roam Research：网状思维
- OneNote：自由度高

#### 知识库
- 个人维基
- 云端存储
- 版本控制
- 搜索优化

## 知识应用实践

### 输出分享

#### 内容创作
- 博客写作
- 技术分享
- 课程开发
- 书籍撰写

#### 社交分享
- 朋友圈分享
- 社群讨论
- 演讲展示
- 导师指导

### 问题解决

#### 场景应用
- 工作项目
- 生活决策
- 学习提升
- 创新创业

#### 思维训练
- 案例分析
- 模拟练习
- 反思总结
- 持续改进

## 知识更新维护

### 定期回顾
- 每日总结
- 每周梳理
- 每月回顾
- 每年规划

### 知识迭代
- 过时信息清理
- 新知识融合
- 结构调整
- 质量提升

### 评估优化
- 使用频率统计
- 价值评估
- 效果反馈
- 系统改进`,
    summary: '全面介绍了个人知识管理体系的构建方法，包括分类、获取、组织、存储、应用和维护。',
    tags: ['tag-8', 'tag-6'],
    category: 'cat-4',
    source: 'upload',
    sourceFile: '个人知识管理指南.epub',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-01'),
    wordCount: 810,
    readingTime: 6,
    difficulty: 'medium',
    keyPoints: [
      '知识管理需要系统性的方法',
      '分类体系是组织知识的基础',
      '工具选择要适合个人习惯',
      '输出分享是知识价值的体现',
      '持续维护是长期有效的保障'
    ],
    relatedNotes: ['note-9', 'note-10'],
    accessCount: 34,
    lastAccessed: new Date('2024-04-08'),
    rating: 5,
    isFavorite: true,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-13-1',
        timestamp: new Date('2024-04-01T10:30:00'),
        type: 'create',
        changeDescription: '上传个人知识管理指南电子书',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 810,
        version: 1
      }
    ]
  },
  {
    id: 'note-14',
    title: '如何进行有效的代码审查',
    content: `# 如何进行有效的代码审查\n\n## 核心原则\n\n### 1. 明确目标\n代码审查的主要目标是提高代码质量、发现潜在缺陷、促进知识共享，而不是批评个人。\n\n### 2. 保持建设性\n提供具体、可操作的建议。关注代码本身，而不是作者。\n\n### 3. 及时反馈\n小批量、高频率的审查优于一次性审查大量代码。\n\n## 审查清单\n\n- **可读性**: 代码是否清晰易懂？命名是否规范？\n- **功能性**: 代码是否实现了预期功能？是否存在逻辑错误？\n- **健壮性**: 是否处理了边界情况和异常？\n- **安全性**: 是否存在安全漏洞？\n- **性能**: 是否存在明显的性能问题？\n- **测试**: 是否有足够的测试覆盖？\n\n## 最佳实践\n\n- **自动化先行**: 依赖 Lint 工具和自动化测试来捕捉风格和低级错误。\n- **限定范围**: 一次审查不应超过400行代码。\n- **设定时间**: 审查时间不应超过60分钟，以保持专注。\n- **双向沟通**: 鼓励作者和审查者之间的讨论。`,
    summary: '介绍了有效代码审查的核心原则、清单和最佳实践，旨在提高代码质量和团队协作效率。',
    tags: ['tag-4', 'tag-6'],
    category: 'cat-2',
    source: 'manual',
    createdAt: new Date('2024-04-05'),
    updatedAt: new Date('2024-04-05'),
    wordCount: 310,
    readingTime: 3,
    difficulty: 'medium',
    keyPoints: [
      '代码审查的目标是提升代码质量和知识共享',
      '反馈应具有建设性并关注代码本身',
      '自动化工具可以分担部分审查工作',
      '限定审查范围和时间可以提高效率'
    ],
    relatedNotes: ['note-6', 'note-11'],
    accessCount: 12,
    lastAccessed: new Date('2024-04-10'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-14-1',
        timestamp: new Date('2024-04-05T14:00:00'),
        type: 'create',
        changeDescription: '创建代码审查最佳实践笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 310,
        version: 1
      }
    ]
  },
  {
    id: 'note-15',
    title: '增长黑客的核心框架AARRR',
    content: `# 增长黑客的核心框架AARRR\n\nAARRR模型是增长黑客的经典框架，描述了用户生命周期的五个关键阶段。\n\n## 1. 获取用户 (Acquisition)\n用户从哪里来？\n- **渠道**: SEO, SEM, 内容营销, 社交媒体, 病毒传播\n- **指标**: 访问量, 转化率, 获客成本(CAC)\n\n## 2. 提高活跃度 (Activation)\n用户的首次良好体验。\n- **关键**: 快速让用户体验到“啊哈时刻” (Aha Moment)\n- **指标**: 注册转化率, 关键功能使用率\n\n## 3. 提高留存率 (Retention)\n用户是否会回来？\n- **策略**: 个性化推荐, 邮件/推送召回, 会员体系\n- **指标**: 次日/7日/30日留存率, 用户流失率\n\n## 4. 获取收入 (Revenue)\n如何从用户身上赚钱？\n- **模式**: 订阅, 广告, 交易抽成, 增值服务\n- **指标**: 用户生命周期价值(LTV), 付费转化率, ARPU\n\n## 5. 自传播 (Referral)\n用户是否愿意推荐产品？\n- **机制**: 邀请好友得奖励, 分享内容\n- **指标**: K因子(病毒系数), 推荐率`,
    summary: '详细解读了增长黑客的AARRR模型，涵盖用户获取、激活、留存、收入和自传播五个关键环节。',
    tags: ['tag-3', 'tag-7'],
    category: 'cat-3',
    source: 'chat',
    createdAt: new Date('2024-04-08'),
    updatedAt: new Date('2024-04-08'),
    wordCount: 350,
    readingTime: 3,
    difficulty: 'medium',
    keyPoints: [
      'AARRR模型是用户生命周期的核心框架',
      '激活阶段的关键是让用户快速体验核心价值',
      '留存是增长的基础',
      'LTV > CAC 是商业模式健康的关键',
      '自传播能极大降低获客成本'
    ],
    relatedNotes: ['note-3', 'note-12'],
    accessCount: 40,
    lastAccessed: new Date('2024-04-15'),
    rating: 5,
    isFavorite: true,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-15-1',
        timestamp: new Date('2024-04-08T11:00:00'),
        type: 'create',
        changeDescription: '创建AARRR模型笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 350,
        version: 1
      }
    ]
  },
  {
    id: 'note-16',
    title: 'OKR目标管理法实践指南',
    content: `# OKR目标管理法实践指南\n\nOKR (Objectives and Key Results) 是一种目标设定和管理框架。\n\n## 核心理念\n- **目标 (Objective)**: 我想做什么？鼓舞人心、有挑战性的定性目标。\n- **关键结果 (Key Result)**: 我如何知道我做到了？可衡量、可验证的定量结果。\n\n## 设定原则\n- **对齐**: 确保个人、团队和公司目标一致。\n- **挑战性**: 目标应该是有野心的，跳一跳才能够得着。\n- **透明**: 公司所有层级的OKR都是公开的。\n- **专注**: 每个周期设定3-5个O，每个O对应3-5个KR。\n\n## 实施周期\n1. **设定**: 周期开始时，团队共同制定OKR。\n2. **跟进**: 周期内，定期（如每周）检查进度。\n3. **复盘**: 周期结束时，对KR进行评分和复盘。\n\n## 常见误区\n- **把KR当成任务列表**: KR是结果，不是待办事项。\n- **与绩效考核强绑定**: OKR是目标管理工具，而非绩效评估工具。\n- **设定过多的OKR**: 导致失焦。`,
    summary: '一份关于OKR目标管理法的实践指南，涵盖其核心理念、设定原则、实施周期和常见误区。',
    tags: ['tag-6'],
    category: 'cat-4',
    source: 'upload',
    sourceFile: 'OKR-guide.md',
    createdAt: new Date('2024-04-10'),
    updatedAt: new Date('2024-04-10'),
    wordCount: 290,
    readingTime: 2,
    difficulty: 'easy',
    keyPoints: [
      'OKR由定性的目标和定量的关键结果组成',
      '对齐、挑战、透明、专注是核心原则',
      'OKR不应与绩效考核直接挂钩'
    ],
    relatedNotes: ['note-10', 'note-13'],
    accessCount: 55,
    lastAccessed: new Date('2024-04-18'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-16-1',
        timestamp: new Date('2024-04-10T09:00:00'),
        type: 'create',
        changeDescription: '创建OKR指南笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 290,
        version: 1
      }
    ]
  },
  {
    id: 'note-17',
    title: '设计思维（Design Thinking）入门',
    content: `# 设计思维（Design Thinking）入门\n\n设计思维是一个以人为本的解决问题的方法论。\n\n## 五个阶段\n1. **共情 (Empathize)**: 深入理解你的用户。通过观察、访谈等方式，设身处地感受用户的体验和痛点。\n2. **定义 (Define)**: 分析你的观察结果，明确核心问题。形成一个清晰、有意义的问题陈述。\n3. **构思 (Ideate)**: 针对定义好的问题，进行头脑风暴，产生尽可能多的解决方案。\n4. **原型 (Prototype)**: 将想法转化为可触摸、可测试的低成本原型。\n5. **测试 (Test)**: 将原型交给真实用户测试，收集反馈，迭代优化。\n\n## 核心特点\n- **以人为本**: 始终将用户置于中心。\n- **迭代性**: 这是一个非线性的、循环往复的过程。\n- **协作性**: 鼓励跨学科团队合作。\n- **实践性**: 强调动手做，从实践中学习。`,
    summary: '介绍了设计思维的五个核心阶段：共情、定义、构思、原型和测试，强调其以人为本、迭代协作的特点。',
    tags: ['tag-1', 'tag-8'],
    category: 'cat-1',
    source: 'manual',
    createdAt: new Date('2024-04-12'),
    updatedAt: new Date('2024-04-12'),
    wordCount: 280,
    readingTime: 2,
    difficulty: 'easy',
    keyPoints: [
      '设计思维是一个以人为本的创新框架',
      '包含共情、定义、构思、原型、测试五个阶段',
      '过程是迭代而非线性的'
    ],
    relatedNotes: ['note-9', 'note-2'],
    accessCount: 60,
    lastAccessed: new Date('2024-04-20'),
    rating: 5,
    isFavorite: true,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-17-1',
        timestamp: new Date('2024-04-12T16:00:00'),
        type: 'create',
        changeDescription: '创建设计思维入门笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 280,
        version: 1
      }
    ]
  },
  {
    id: 'note-18',
    title: '云原生技术栈概览',
    content: `# 云原生技术栈概览\n\n云原生是一套构建和运行可伸缩应用程序的方法论。\n\n## 核心技术\n- **容器化 (Containerization)**: 以Docker为代表，提供轻量级的应用打包和隔离环境。\n- **容器编排 (Orchestration)**: 以Kubernetes (K8s)为事实标准，负责容器的部署、扩展和管理。\n- **微服务 (Microservices)**: 将大型应用拆分为一组小而独立的服务。\n- **服务网格 (Service Mesh)**: 以Istio为代表，处理服务间通信，提供流量管理、安全和可观察性。\n- **声明式API (Declarative APIs)**: 开发者只需声明期望状态，系统会自动达成。\n\n## CI/CD\n持续集成(CI)和持续部署(CD)是云原生的关键实践，通过自动化流程加速软件交付。\n- **工具**: Jenkins, GitLab CI, GitHub Actions`,
    summary: '概述了云原生的核心技术栈，包括容器化、容器编排、微服务和服务网格，以及CI/CD实践。',
    tags: ['tag-4'],
    category: 'cat-2',
    source: 'chat',
    createdAt: new Date('2024-04-15'),
    updatedAt: new Date('2024-04-15'),
    wordCount: 250,
    readingTime: 2,
    difficulty: 'hard',
    keyPoints: [
      '云原生旨在构建可伸缩、弹性的应用',
      '容器和Kubernetes是云原生的基石',
      '微服务架构是核心组织形式',
      'CI/CD是实现敏捷交付的关键'
    ],
    relatedNotes: ['note-4', 'note-8'],
    accessCount: 45,
    lastAccessed: new Date('2024-04-22'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-18-1',
        timestamp: new Date('2024-04-15T10:30:00'),
        type: 'create',
        changeDescription: '创建云原生技术栈笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 250,
        version: 1
      }
    ]
  },
  {
    id: 'note-19',
    title: 'A/B测试的正确姿势',
    content: `# A/B测试的正确姿势\n\n## 科学流程\n1. **提出假设**: 基于数据和洞察，提出一个明确的、可验证的假设。例如：“将购买按钮从蓝色改为橙色，可以提高点击率”。\n2. **设定指标**: 确定衡量成功与否的核心指标（如点击率）和辅助指标（如转化率、跳出率）。\n3. **计算样本量**: 根据预期的提升幅度和统计显著性要求，计算需要多少流量参与测试。\n4. **实施测试**: 将流量随机分配到A版本（对照组）和B版本（实验组）。\n5. **分析结果**: 测试达到所需样本量后，分析数据，判断结果是否具有统计显著性。\n\n## 常见陷阱\n- **样本量不足**: 导致结果不可信。\n- **测试时间过短**: 未覆盖不同时间段的用户行为模式（如工作日和周末）。\n- **辛普森悖论**: 忽略了不同用户分层下的差异，导致整体结论错误。\n- **偷看结果**: 提前结束测试，导致结论偏差。`,
    summary: '讲解了进行A/B测试的科学流程和需要避免的常见陷阱，以确保测试结果的有效性和可靠性。',
    tags: ['tag-5', 'tag-2'],
    category: 'cat-1',
    source: 'manual',
    createdAt: new Date('2024-04-18'),
    updatedAt: new Date('2024-04-18'),
    wordCount: 300,
    readingTime: 2,
    difficulty: 'medium',
    keyPoints: [
      'A/B测试必须从一个明确的假设开始',
      '需要提前计算所需样本量',
      '避免在测试中途偷看结果',
      '注意辛普森悖论等统计陷阱'
    ],
    relatedNotes: ['note-5', 'note-15'],
    accessCount: 38,
    lastAccessed: new Date('2024-04-25'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-19-1',
        timestamp: new Date('2024-04-18T14:20:00'),
        type: 'create',
        changeDescription: '创建A/B测试指南笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 300,
        version: 1
      }
    ]
  },
  {
    id: 'note-20',
    title: '第一性原理思考法',
    content: `# 第一性原理思考法\n\n第一性原理（First Principles Thinking）是一种回归事物最基本组成部分，进行推理的思维方式。它强调打破类比思维的局限。\n\n## 如何实践\n1. **识别和定义当前假设**: 明确你正在处理的问题和普遍接受的观点。例如：“电池非常昂贵”。\n2. **分解问题至基本要素**: 将问题分解为最基础的、无法再分割的事实。例如，电池由哪些原材料构成？碳、镍、铝等。\n3. **从头开始重构解决方案**: 基于这些基本要素，创造一个新的、更优的解决方案。例如，如果从伦敦金属交易所购买这些原材料，成本是多少？远低于现有电池价格，这说明存在巨大的创新空间。\n\n## 案例：埃隆·马斯克与SpaceX\n- **传统观点**: 火箭非常昂贵，因为它们一直都很昂贵。\n- **第一性原理**: 火箭由什么构成？航空级铝合金、钛、铜、碳纤维。这些材料的成本只占火箭总价的2%。\n- **重构方案**: 最大的成本在于制造和回收。因此，SpaceX的目标是制造可重复使用的火箭。`,
    summary: '介绍了第一性原理思考法，一种通过将问题分解到最基本要素来寻求突破性创新的思维模型。',
    tags: ['tag-8'],
    category: 'cat-4',
    source: 'chat',
    createdAt: new Date('2024-04-21'),
    updatedAt: new Date('2024-04-21'),
    wordCount: 320,
    readingTime: 3,
    difficulty: 'hard',
    keyPoints: [
      '第一性原理是打破类比思维的工具',
      '核心是分解问题到最基本的事实',
      '从基本事实出发，重构解决方案'
    ],
    relatedNotes: ['note-9', 'note-13'],
    accessCount: 70,
    lastAccessed: new Date('2024-04-28'),
    rating: 5,
    isFavorite: true,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-20-1',
        timestamp: new Date('2024-04-21T18:00:00'),
        type: 'create',
        changeDescription: '创建第一性原理笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 320,
        version: 1
      }
    ]
  },
  {
    id: 'note-21',
    title: '平台战略的核心：网络效应',
    content: `# 平台战略的核心：网络效应\n\n网络效应（Network Effects）是指一个产品或服务的价值随着用户数量的增加而增加。\n\n## 类型\n- **直接网络效应**: 同边网络效应。用户越多，对其他同类用户的价值越大。例如：社交网络（微信）、即时通讯工具。\n- **间接网络效应**: 跨边网络效应。一边的用户增长，能为另一边的用户创造更多价值。例如：电商平台（买家越多，卖家越愿意入驻，反之亦然）、操作系统（用户越多，开发者越愿意开发应用）。\n\n## 挑战\n- **冷启动问题**: 在没有用户时，平台没有价值，如何吸引第一批用户？\n- **“鸡生蛋还是蛋生鸡”**: 对于双边平台，先有买家还是先有卖家？\n\n## 策略\n- **单边引爆**: 先聚焦一类用户，为他们提供极致的单点价值，再开放另一边。\n- **补贴策略**: 通过补贴吸引对价格敏感的一方，从而带动另一方。`,
    summary: '阐述了平台战略的核心概念——网络效应，区分了直接与间接网络效应，并讨论了平台冷启动的挑战与策略。',
    tags: ['tag-3', 'tag-7'],
    category: 'cat-3',
    source: 'manual',
    createdAt: new Date('2024-04-24'),
    updatedAt: new Date('2024-04-24'),
    wordCount: 280,
    readingTime: 2,
    difficulty: 'hard',
    keyPoints: [
      '网络效应是平台价值增长的关键驱动力',
      '分为直接网络效应和间接网络效应',
      '冷启动是平台面临的最大挑战之一'
    ],
    relatedNotes: ['note-3', 'note-12'],
    accessCount: 33,
    lastAccessed: new Date('2024-04-30'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-21-1',
        timestamp: new Date('2024-04-24T15:00:00'),
        type: 'create',
        changeDescription: '创建平台战略笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 280,
        version: 1
      }
    ]
  },
  {
    id: 'note-22',
    title: '前端性能优化清单',
    content: `# 前端性能优化清单\n\n## 关键渲染路径优化\n- 减少CSS和JavaScript对渲染的阻塞。\n- 使用 async 或 defer 加载脚本。\n\n## 资源加载优化\n- **图片优化**: 使用WebP格式，懒加载，响应式图片。\n- **代码压缩**: 使用工具（如Terser, cssnano）压缩JS和CSS。\n- **代码分割 (Code Splitting)**: 按需加载代码块。\n- **使用CDN**: 加速静态资源分发。\n\n## 缓存策略\n- 合理利用浏览器缓存（Cache-Control, ETag）。\n- 使用Service Worker进行更精细的缓存控制。\n\n## 渲染性能优化\n- 减少重排（Reflow）和重绘（Repaint）。\n- 使用 transform 和 opacity 触发GPU加速。\n- 对长列表进行虚拟化（Virtualization）。`,
    summary: '提供了一份前端性能优化的实用清单，涵盖了关键渲染路径、资源加载、缓存和渲染性能等多个方面。',
    tags: ['tag-4', 'tag-2'],
    category: 'cat-2',
    source: 'upload',
    sourceFile: 'frontend-perf-checklist.pdf',
    createdAt: new Date('2024-04-26'),
    updatedAt: new Date('2024-04-26'),
    wordCount: 260,
    readingTime: 2,
    difficulty: 'medium',
    keyPoints: [
      '优化关键渲染路径是首要任务',
      '图片和代码是主要的优化对象',
      '有效的缓存策略能极大提升二次加载速度',
      '避免不必要的重排和重绘'
    ],
    relatedNotes: ['note-4', 'note-7'],
    accessCount: 51,
    lastAccessed: new Date('2024-05-02'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-22-1',
        timestamp: new Date('2024-04-26T12:00:00'),
        type: 'create',
        changeDescription: '创建前端性能优化笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 260,
        version: 1
      }
    ]
  },
  {
    id: 'note-23',
    title: '用户旅程地图绘制方法',
    content: `# 用户旅程地图绘制方法\n\n用户旅程地图（User Journey Map）是可视化用户与产品或服务交互过程的工具。\n\n## 构成要素\n1. **角色 (Persona)**: 地图所代表的特定用户画像。\n2. **场景 (Scenario)**: 用户试图实现的目标或场景。\n3. **阶段 (Phases)**: 用户完成目标所经历的高层次阶段。\n4. **行为 (Actions)**: 用户在每个阶段的具体操作。\n5. **想法 (Thoughts)**: 用户在每个阶段的想法和问题。\n6. **情绪 (Emotions)**: 用户在每个阶段的情绪曲线，通常用高低起伏的线表示。\n7. **痛点 (Pain Points)**: 用户遇到的障碍和困难。\n8. **机会 (Opportunities)**: 基于痛点可以改进产品或服务的机会点。\n\n## 绘制步骤\n1. **设定范围**: 明确地图的目标和范围。\n2. **用户研究**: 基于真实数据，而不是想象。\n3. **列出触点和阶段**: 识别用户与产品的所有交互点。\n4. **填充细节**: 丰富每个阶段的行为、想法和情绪。\n5. **识别机会**: 找到改进的关键时刻。`,
    summary: '介绍了用户旅程地图的构成要素和绘制步骤，这是一个理解和优化用户体验的强大工具。',
    tags: ['tag-2'],
    category: 'cat-1',
    source: 'manual',
    createdAt: new Date('2024-04-29'),
    updatedAt: new Date('2024-04-29'),
    wordCount: 310,
    readingTime: 3,
    difficulty: 'medium',
    keyPoints: [
      '用户旅程地图是用户体验的可视化呈现',
      '必须基于真实的用户研究数据',
      '情绪曲线和痛点是发现机会的关键'
    ],
    relatedNotes: ['note-2', 'note-17'],
    accessCount: 42,
    lastAccessed: new Date('2024-05-05'),
    rating: 5,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-23-1',
        timestamp: new Date('2024-04-29T17:00:00'),
        type: 'create',
        changeDescription: '创建用户旅程地图笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 310,
        version: 1
      }
    ]
  },
  {
    id: 'note-24',
    title: '金融科技（FinTech）发展趋势',
    content: `# 金融科技（FinTech）发展趋势\n\n## 1. 嵌入式金融 (Embedded Finance)\n将金融服务（如支付、信贷、保险）无缝集成到非金融企业的平台中。例如，在电商平台结账时直接申请分期付款。\n\n## 2. 先买后付 (Buy Now, Pay Later - BNPL)\n作为一种短期消费信贷迅速崛起，挑战传统信用卡模式。\n\n## 3. 人工智能与机器学习\n在风险控制、智能投顾、反欺诈、个性化营销等领域广泛应用。\n\n## 4. 区块链与去中心化金融 (DeFi)\n虽然面临监管挑战，但仍在探索更高效、透明、去中介化的金融服务模式。\n\n## 5. 监管科技 (RegTech)\n利用技术帮助金融机构满足日益复杂的监管要求，提高合规效率。`,
    summary: '盘点了当前金融科技领域的几大发展趋势，包括嵌入式金融、BNPL、AI应用、DeFi和监管科技。',
    tags: ['tag-7', 'tag-1'],
    category: 'cat-5',
    source: 'chat',
    createdAt: new Date('2024-05-02'),
    updatedAt: new Date('2024-05-02'),
    wordCount: 270,
    readingTime: 2,
    difficulty: 'medium',
    keyPoints: [
      '嵌入式金融将金融服务融入生活场景',
      'AI正在重塑金融行业的效率和风控',
      'DeFi是对传统金融模式的颠覆性探索',
      '监管科技成为金融机构的刚需'
    ],
    relatedNotes: ['note-12', 'note-21'],
    accessCount: 29,
    lastAccessed: new Date('2024-05-08'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-24-1',
        timestamp: new Date('2024-05-02T11:30:00'),
        type: 'create',
        changeDescription: '创建金融科技趋势笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 270,
        version: 1
      }
    ]
  },
  {
    id: 'note-25',
    title: '如何在演讲中运用故事思维',
    content: `# 如何在演讲中运用故事思维\n\n## 为什么故事有效？\n故事能激发情感、建立连接、让复杂信息更容易被理解和记忆。\n\n## 经典故事结构：英雄之旅\n1. **平凡世界**: 介绍主角和他的日常生活。\n2. **冒险召唤**: 一个事件打破了平静，主角面临挑战。\n3. **拒绝召唤**: 主角犹豫、恐惧。\n4. **遇见导师**: 获得智慧或工具。\n5. **跨越边界**: 主角下定决心，进入新世界。\n6. **考验、盟友和敌人**: 主角在新世界中学习和成长。\n7. **最终考验**: 面对最大的挑战。\n8. **获得宝藏**: 战胜挑战，达成目标。\n9. **回归之路**: 带着成果返回。\n10. **复活**: 最终的考验，证明自己的蜕变。\n11. **满载而归**: 回到平凡世界，用成果改变世界。\n\n## 实践技巧\n- **设定一个英雄**: 你的听众，或者你的产品。\n- **制造一个冲突**: 英雄面临的痛点或挑战。\n- **展示解决方案**: 你的观点或产品如何帮助英雄战胜冲突。\n- **描绘一个美好的结局**: 使用你的方案后，世界会变得怎样。`,
    summary: '探讨了如何在演讲和沟通中运用故事思维，并介绍了经典的“英雄之旅”故事结构，以增强信息的吸引力和记忆点。',
    tags: ['tag-6', 'tag-8'],
    category: 'cat-4',
    source: 'manual',
    createdAt: new Date('2024-05-05'),
    updatedAt: new Date('2024-05-05'),
    wordCount: 380,
    readingTime: 3,
    difficulty: 'easy',
    keyPoints: [
      '故事是传递信息的强大载体',
      '英雄之旅是经典的故事叙事框架',
      '将听众或产品设定为故事的主角'
    ],
    relatedNotes: ['note-10', 'note-13'],
    accessCount: 65,
    lastAccessed: new Date('2024-05-12'),
    rating: 5,
    isFavorite: true,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-25-1',
        timestamp: new Date('2024-05-05T19:00:00'),
        type: 'create',
        changeDescription: '创建故事思维笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 380,
        version: 1
      }
    ]
  },
  {
    id: 'note-26',
    title: 'DevOps文化的核心：CALMS模型',
    content: `# DevOps文化的核心：CALMS模型\n\nCALMS是评估和实施DevOps文化的框架。\n\n- **C (Culture)**: 文化。建立共享责任、信任和协作的文化。这是最重要的基础。\n- **A (Automation)**: 自动化。自动化构建、测试、部署等重复性任务，减少人为错误，提高效率。\n- **L (Lean)**: 精益。应用精益思想，关注价值流动，消除浪费，小批量快速迭代。\n- **M (Measurement)**: 度量。通过度量来监控系统性能和流程效率，驱动持续改进。\n- **S (Sharing)**: 分享。鼓励团队之间、开发与运维之间分享知识、经验和工具。`,
    summary: '介绍了CALMS模型，它从文化、自动化、精益、度量和分享五个方面定义了成功DevOps的核心要素。',
    tags: ['tag-4', 'tag-6'],
    category: 'cat-2',
    source: 'chat',
    createdAt: new Date('2024-05-08'),
    updatedAt: new Date('2024-05-08'),
    wordCount: 220,
    readingTime: 2,
    difficulty: 'medium',
    keyPoints: [
      'CALMS是DevOps的文化框架',
      '文化是DevOps成功的基石',
      '自动化、精益、度量、分享是四大支柱'
    ],
    relatedNotes: ['note-4', 'note-10'],
    accessCount: 48,
    lastAccessed: new Date('2024-05-15'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-26-1',
        timestamp: new Date('2024-05-08T13:00:00'),
        type: 'create',
        changeDescription: '创建DevOps CALMS模型笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 220,
        version: 1
      }
    ]
  },
  {
    id: 'note-27',
    title: '游戏化设计入门',
    content: `# 游戏化设计入门\n\n游戏化（Gamification）是将游戏元素和机制应用到非游戏场景中，以提高用户参与度和积极性。\n\n## 核心元素\n- **PBL三件套**: 分数(Points), 徽章(Badges), 排行榜(Leaderboards)。这是最基础的应用。\n- **内在动机 vs 外在动机**: 游戏化不仅是奖励，更要激发用户的内在动机，如成就感、社交连接、使命感。\n- **SAPS模型**: 地位(Status), 权限(Access), 能力(Power), 物品(Stuff)。更深层次的奖励设计。\n\n## Octalysis八角行为分析法\n一个更全面的游戏化设计框架，包含八个核心驱动力：\n1. 史诗意义与使命感\n2. 进步与成就感\n3. 创意与反馈\n4. 所有权与拥有感\n5. 社交影响与关联性\n6. 稀缺性与渴望\n7. 未知性与好奇心\n8. 损失与逃避心`,
    summary: '介绍了游戏化设计的入门概念，包括PBL三件套、动机理论，以及更全面的Octalysis八角行为分析法框架。',
    tags: ['tag-1', 'tag-2'],
    category: 'cat-1',
    source: 'upload',
    sourceFile: 'gamification-intro.docx',
    createdAt: new Date('2024-05-11'),
    updatedAt: new Date('2024-05-11'),
    wordCount: 300,
    readingTime: 2,
    difficulty: 'medium',
    keyPoints: [
      '游戏化是将游戏机制用于非游戏场景',
      '不能只依赖PBL等外在奖励',
      'Octalysis八角分析法是全面的设计框架'
    ],
    relatedNotes: ['note-2', 'note-15'],
    accessCount: 35,
    lastAccessed: new Date('2024-05-18'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-27-1',
        timestamp: new Date('2024-05-11T10:00:00'),
        type: 'create',
        changeDescription: '创建游戏化设计笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 300,
        version: 1
      }
    ]
  },
  {
    id: 'note-28',
    title: '人工智能伦理的核心议题',
    content: `# 人工智能伦理的核心议题\n\n## 1. 偏见与公平 (Bias and Fairness)\nAI模型可能会从训练数据中学习并放大社会偏见，导致对特定人群的不公平决策。\n\n## 2. 透明性与可解释性 (Transparency and Explainability)\n“黑箱”模型使得我们难以理解其决策过程，这在医疗、金融等高风险领域是不可接受的。\n\n## 3. 责任与问责 (Accountability and Liability)\n当AI系统出错并造成损害时，谁应该负责？是开发者、使用者还是所有者？\n\n## 4. 隐私 (Privacy)\n大规模数据收集和分析对个人隐私构成了前所未有的威胁。\n\n## 5. 安全性 (Safety and Security)\nAI系统可能被恶意攻击（如对抗性攻击），或产生意想不到的有害行为。\n\n## 6. 人类自主性 (Human Autonomy)\n过度依赖AI可能削弱人类的决策能力和自主性。`,
    summary: '探讨了人工智能伦理面临的几个核心议题，包括偏见与公平、透明度、责任、隐私、安全和对人类自主性的影响。',
    tags: ['tag-1', 'tag-5'],
    category: 'cat-5',
    source: 'manual',
    createdAt: new Date('2024-05-14'),
    updatedAt: new Date('2024-05-14'),
    wordCount: 290,
    readingTime: 2,
    difficulty: 'hard',
    keyPoints: [
      'AI偏见是当前最紧迫的伦理挑战之一',
      '可解释性对于建立信任至关重要',
      'AI的责任归属是一个复杂的法律和伦理问题',
      '需要在技术发展和隐私保护之间取得平衡'
    ],
    relatedNotes: ['note-1', 'note-5'],
    accessCount: 41,
    lastAccessed: new Date('2024-05-21'),
    rating: 5,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-28-1',
        timestamp: new Date('2024-05-14T16:30:00'),
        type: 'create',
        changeDescription: '创建AI伦理笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 290,
        version: 1
      }
    ]
  },
  {
    id: 'note-29',
    title: '决策用的心智模型',
    content: `# 决策用的心智模型\n\n## 1. 第二序思维 (Second-Order Thinking)\n不仅仅考虑一个决策的直接后果（第一序），还要深入思考其后续影响（第二序、第三序...）。“然后呢？”\n\n## 2. 反演思维 (Inversion)\n“反过来想，总是反过来想。”——查理·芒格。与其思考如何成功，不如思考如何避免失败。\n\n## 3. 概率思维 (Probabilistic Thinking)\n用概率来评估不同结果的可能性，而不是用简单的“是”或“否”来判断。\n\n## 4. 能力圈 (Circle of Competence)\n清楚地认识到自己能力的边界，只在边界内做重要决策。\n\n## 5. 奥卡姆剃刀 (Occam\'s Razor)\n“如无必要，勿增实体”。在多种解释中，最简单的那个往往是最好的。`,
    summary: '介绍了几种强大的用于改善决策质量的心智模型，包括第二序思维、反演思维、概率思维、能力圈和奥卡姆剃刀。',
    tags: ['tag-8', 'tag-6'],
    category: 'cat-4',
    source: 'chat',
    createdAt: new Date('2024-05-17'),
    updatedAt: new Date('2024-05-17'),
    wordCount: 280,
    readingTime: 2,
    difficulty: 'medium',
    keyPoints: [
      '第二序思维帮助我们看得更远',
      '反演思维通过避免愚蠢来获得智慧',
      '能力圈让我们保持谦逊和专注',
      '奥卡姆剃刀追求简单有效的解释'
    ],
    relatedNotes: ['note-13', 'note-20'],
    accessCount: 80,
    lastAccessed: new Date('2024-05-25'),
    rating: 5,
    isFavorite: true,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-29-1',
        timestamp: new Date('2024-05-17T12:00:00'),
        type: 'create',
        changeDescription: '创建心智模型笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 280,
        version: 1
      }
    ]
  },
  {
    id: 'note-30',
    title: '未来工作的趋势展望',
    content: `# 未来工作的趋势展望\n\n## 1. 混合式工作成为常态\n结合了远程办公和办公室工作的模式将成为主流，对管理和协作工具提出更高要求。\n\n## 2. 技能更新周期缩短\n终身学习成为必需品。适应性、学习能力和解决复杂问题的能力比特定技能更重要。\n\n## 3. 人机协作深化\nAI将成为工作伙伴，而不是替代者。人类将更专注于创造性、战略性和共情性的工作。\n\n## 4. “零工经济”与多元化职业\n越来越多的人将拥有多重职业身份，项目制合作将更加普遍。\n\n## 5. 关注员工福祉\n心理健康、工作与生活的平衡、组织的包容性将成为吸引和留住人才的关键。`,
    summary: '展望了未来工作的几大趋势，包括混合式工作的普及、技能更新的加速、人机协作的深化以及对员工福祉的日益关注。',
    tags: ['tag-6', 'tag-7'],
    category: 'cat-5',
    source: 'manual',
    createdAt: new Date('2025-07-05'),
    updatedAt: new Date('2025-07-05'),
    wordCount: 260,
    readingTime: 2,
    difficulty: 'easy',
    keyPoints: [
      '混合式工作是未来趋势',
      '终身学习能力是核心竞争力',
      'AI将成为人类的协作工具',
      '员工福祉成为组织管理的重要议题'
    ],
    relatedNotes: ['note-10', 'note-13'],
    accessCount: 50,
    lastAccessed: new Date('2025-07-05'),
    rating: 4,
    isFavorite: false,
    isArchived: false,
    saveHistory: [
      {
        id: 'save-30-1',
        timestamp: new Date('2025-07-05T09:30:00'),
        type: 'create',
        changeDescription: '创建未来工作趋势笔记',
        changedFields: ['title', 'content', 'tags', 'category'],
        wordCountDelta: 260,
        version: 1
      }
    ]
  }
]

// 模拟统计数据
export const mockStats: KnowledgeStats = {
  totalNotes: 30,
  totalWords: 12380,
  totalReadingTime: 102,
  averageRating: 4.4,
  topTags: [
    { tag: mockTags[1], count: 12 },
    { tag: mockTags[3], count: 9 },
    { tag: mockTags[0], count: 8 },
    { tag: mockTags[5], count: 8 },
    { tag: mockTags[7], count: 8 },
    { tag: mockTags[8], count: 0 },
    { tag: mockTags[9], count: 0 },
    { tag: mockTags[10], count: 0 },
    { tag: mockTags[11], count: 0 },
    { tag: mockTags[12], count: 0 }
  ],
  topCategories: [
    { category: mockCategories[0], count: 15 },
    { category: mockCategories[1], count: 12 },
    { category: mockCategories[3], count: 10 },
    { category: mockCategories[2], count: 8 },
    { category: mockCategories[4], count: 7 }
  ],
  recentNotes: mockNotes.slice(mockNotes.length - 3, mockNotes.length).reverse(),
  favoriteNotes: mockNotes.filter(note => note.isFavorite),
  trendingNotes: [...mockNotes].sort((a, b) => b.accessCount - a.accessCount).slice(0, 5)
}

// 搜索和过滤功能
export function searchNotes(query: string, notes: KnowledgeNote[] = mockNotes): KnowledgeNote[] {
  if (!query.trim()) return notes
  
  const lowercaseQuery = query.toLowerCase()
  return notes.filter(note => 
    note.title.toLowerCase().includes(lowercaseQuery) ||
    note.content.toLowerCase().includes(lowercaseQuery) ||
    note.summary.toLowerCase().includes(lowercaseQuery) ||
    note.tags.some(tagId => {
      const tag = mockTags.find(t => t.id === tagId)
      return tag?.name.toLowerCase().includes(lowercaseQuery)
    }) ||
    note.keyPoints.some(point => point.toLowerCase().includes(lowercaseQuery))
  )
}

export function filterNotesByTag(tagId: string, notes: KnowledgeNote[] = mockNotes): KnowledgeNote[] {
  return notes.filter(note => note.tags.includes(tagId))
}

export function filterNotesByCategory(categoryId: string, notes: KnowledgeNote[] = mockNotes): KnowledgeNote[] {
  return notes.filter(note => note.category === categoryId)
}

export function getRelatedNotes(noteId: string, notes: KnowledgeNote[] = mockNotes): KnowledgeNote[] {
  const currentNote = notes.find(note => note.id === noteId)
  if (!currentNote) return []
  
  return notes.filter(note => currentNote.relatedNotes.includes(note.id))
}

// 获取笔记的标签详细信息
export function getNoteTagsInfo(note: KnowledgeNote): KnowledgeTag[] {
  return note.tags.map(tagId => mockTags.find(tag => tag.id === tagId)).filter(Boolean) as KnowledgeTag[]
}

// 获取笔记的分类详细信息
export function getNoteCategoryInfo(note: KnowledgeNote): KnowledgeCategory | undefined {
  return mockCategories.find(cat => cat.id === note.category)
}

// 格式化显示笔记信息（用于调试）
export function formatNoteInfo(note: KnowledgeNote): string {
  const tags = getNoteTagsInfo(note)
  const category = getNoteCategoryInfo(note)
  const latestSave = note.saveHistory[note.saveHistory.length - 1]
  
  return `
📖 ${note.title}
🏷️ 标签: ${tags.map(tag => `${tag.name}(${tag.color})`).join(', ')}
📂 分类: ${category?.name}(${category?.color})
⭐ 评分: ${note.rating}/5
👀 访问: ${note.accessCount}次
📝 字数: ${note.wordCount}字
⏱️ 阅读: ${note.readingTime}分钟
💡 关键点: ${note.keyPoints.length}个
🔗 相关: ${note.relatedNotes.length}篇
📅 创建: ${note.createdAt.toLocaleDateString()}
📝 最近保存: ${latestSave?.timestamp.toLocaleString()} (v${latestSave?.version})
💾 保存次数: ${note.saveHistory.length}次
`.trim()
}

// 获取笔记的保存时间线
export function getNoteSaveTimeline(note: KnowledgeNote): SaveRecord[] {
  return note.saveHistory.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

// 获取笔记的版本历史
export function getNoteVersionHistory(note: KnowledgeNote): Array<{
  version: number
  timestamp: Date
  description: string
  type: string
  wordCount: number
}> {
  let cumulativeWordCount = 0
  
  return note.saveHistory
    .sort((a, b) => a.version - b.version)
    .map(record => {
      cumulativeWordCount += record.wordCountDelta || 0
      return {
        version: record.version,
        timestamp: record.timestamp,
        description: record.changeDescription || '未知变更',
        type: record.type,
        wordCount: cumulativeWordCount
      }
    })
}

// 计算笔记的编辑频率
export function getNoteEditFrequency(note: KnowledgeNote): {
  totalEdits: number
  daysActive: number
  editsPerDay: number
  lastEditDaysAgo: number
} {
  const editRecords = note.saveHistory.filter(record => record.type === 'edit')
  const totalEdits = editRecords.length
  
  if (totalEdits === 0) {
    return {
      totalEdits: 0,
      daysActive: 0,
      editsPerDay: 0,
      lastEditDaysAgo: 0
    }
  }
  
  const timestamps = note.saveHistory.map(record => record.timestamp.getTime())
  const firstEdit = Math.min(...timestamps)
  const lastEdit = Math.max(...timestamps)
  const now = Date.now()
  
  const daysActive = Math.max(1, Math.ceil((lastEdit - firstEdit) / (1000 * 60 * 60 * 24)))
  const editsPerDay = totalEdits / daysActive
  const lastEditDaysAgo = Math.ceil((now - lastEdit) / (1000 * 60 * 60 * 24))
  
  return {
    totalEdits,
    daysActive,
    editsPerDay: Number(editsPerDay.toFixed(2)),
    lastEditDaysAgo
  }
}