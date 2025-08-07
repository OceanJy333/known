# Technology Stack

## Framework & Runtime
- **Next.js 15.3.4** - React framework with App Router
- **React 19.1.0** - UI library with latest features
- **TypeScript 5.8.3** - Type safety and developer experience
- **Node.js** - Runtime environment

## Styling & UI
- **Tailwind CSS 3.4.0** - Utility-first CSS framework
- **@tailwindcss/typography** - Enhanced typography styles
- **Lucide React** - Icon library
- **class-variance-authority** - Component variant management
- **clsx** - Conditional className utility

## State Management & Data
- **Zustand 5.0.6** - Lightweight state management
- **React Resizable Panels** - Layout management
- **React Dropzone** - File upload handling

## AI & Content Processing
- **OpenAI 5.7.0** - AI API integration
- **React Markdown 9.0.0** - Markdown rendering
- **remark-gfm** - GitHub Flavored Markdown support
- **rehype-highlight** - Syntax highlighting
- **rehype-raw** - Raw HTML support in markdown

## Development Tools
- **ESLint** - Code linting with Next.js config
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixes

## Build Commands
```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## Environment Configuration
Required environment variables:
- `OPENAI_API_KEY` - OpenAI API authentication
- `OPENAI_MODEL` - Model to use (required)
- `OPENAI_API_BASE_URL` - Custom API endpoint (optional)
- `OPENAI_MAX_CONTENT_LENGTH` - Content truncation limit (default: 8000)
- `OPENAI_TRUNCATION_MESSAGE` - Truncation indicator message

## API Patterns
- **Streaming APIs**: All AI interactions use Server-Sent Events (SSE)
- **Route handlers**: Located in `src/app/api/*/route.ts`
- **Error handling**: Consistent error responses with proper HTTP status codes
- **Type safety**: Full TypeScript coverage for API contracts