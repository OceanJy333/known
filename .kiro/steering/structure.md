# Project Structure

## Root Directory
```
├── src/                    # Source code
├── .kiro/                  # Kiro configuration
├── .yoyo/                  # Project snapshots/backups
├── .env                    # Environment variables
├── package.json            # Dependencies and scripts
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

## Source Code Organization (`src/`)

### Application Layer (`src/app/`)
- **App Router structure** - Next.js 13+ routing
- `layout.tsx` - Root layout component
- `page.tsx` - Home page with dual-mode interface
- `globals.css` - Global styles and CSS variables

### API Routes (`src/app/api/`)
- **Streaming endpoints** - All AI interactions use SSE
- `*-stream/route.ts` - Streaming API handlers
- `analyze-stream/` - Document analysis
- `chat-stream/` - Conversational AI
- `canvas-question-stream/` - Canvas interactions
- `generate-notes-stream/` - Note generation

### Components (`src/components/`)
- **Flat structure** - No deep nesting
- **Feature-based organization** for complex features
- `thinking-mode/` - Canvas and knowledge management UI
  - `canvas/` - Canvas interaction components
  - `notes-sidebar/` - Knowledge library interface
  - `nodes-sidebar/` - Node palette
- `MediaViewer/` - File viewing components
- `ui/` - Reusable UI primitives

### Type Definitions (`src/types/`)
- **Domain-specific types** - One file per domain
- `canvas.ts` - Canvas and node types
- `knowledge.ts` - Knowledge management types
- `media.ts` - File and content types
- `thinking.ts` - Application modes and states

### Utilities (`src/utils/`)
- **Pure functions** - No side effects
- `idGenerator.ts` - Centralized ID management
- `canvasLayout.ts` - Canvas positioning logic
- `__tests__/` - Unit tests for utilities

### Services (`src/services/`)
- **External integrations** - API calls and data processing
- `media/` - File processing services
- `knowledgeSearch.ts` - Search functionality
- `questionProcessor.ts` - AI question handling

### Hooks (`src/hooks/`)
- **Custom React hooks** - Reusable stateful logic
- `useTabs.ts` - Tab management
- `useDiffManager.ts` - Content diff handling
- `useThinkingModeIds.ts` - ID management for canvas

### Library Code (`src/lib/`)
- **Core utilities** - Shared business logic
- `openai.ts` - AI API integration
- `prompts.ts` - Centralized prompt management
- `utils.ts` - General utilities

### Constants (`src/constants/`)
- **Static configuration** - Enums and constants
- `nodeTypes.ts` - Canvas node definitions
- `svgTemplates.ts` - Template configurations

## Naming Conventions

### Files & Directories
- **PascalCase** for React components (`ThinkingMode.tsx`)
- **camelCase** for utilities and services (`idGenerator.ts`)
- **kebab-case** for API routes (`chat-stream/`)
- **lowercase** for configuration files (`next.config.js`)

### Components
- **Functional components** with TypeScript
- **Named exports** for main components
- **Default exports** for pages and layouts
- **Props interfaces** named `ComponentNameProps`

### Types & Interfaces
- **PascalCase** for type names (`CanvasCard`)
- **Descriptive names** over abbreviations
- **Grouped by domain** in separate files
- **Enums** for constants with multiple values

### IDs & Keys
- **Centralized ID generation** via `idGenerator.ts`
- **Prefixed IDs** by type (`note-`, `card-`, `question-`)
- **Timestamp-based** for sortable IDs
- **UUID** for security-sensitive data

## Code Organization Principles

### Component Structure
- **Single responsibility** - One concern per component
- **Composition over inheritance** - Use hooks and composition
- **Props drilling avoidance** - Use Zustand for shared state
- **Error boundaries** for robust error handling

### State Management
- **Local state** for component-specific data
- **Zustand stores** for shared application state
- **Server state** handled by API routes
- **URL state** for shareable application state

### Import Organization
```typescript
// 1. React and Next.js imports
import React from 'react'
import { NextRequest } from 'next/server'

// 2. Third-party libraries
import { clsx } from 'clsx'

// 3. Internal imports (absolute paths with @/)
import { Component } from '@/components/Component'
import { useHook } from '@/hooks/useHook'
import { Type } from '@/types/type'

// 4. Relative imports
import './styles.css'
```

### File Size Guidelines
- **Components**: < 300 lines
- **Utilities**: < 200 lines  
- **API routes**: < 150 lines
- **Types**: No limit (can be large)
- **Split large files** into logical modules