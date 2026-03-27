# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview. Users describe components in natural language, and the AI generates React code that renders in real-time within a virtual file system (no files are written to disk).

**Tech Stack**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Prisma (SQLite), Anthropic Claude AI, Vercel AI SDK

## Development Commands

```bash
# First-time setup - installs deps, generates Prisma client, runs migrations
npm run setup

# Development server with Turbopack (http://localhost:3000)
npm run dev

# Run all tests with Vitest
npm test

# Run specific test file
npx vitest src/path/to/test.test.tsx

# Linting
npm run lint

# Production build
npm run build

# Reset database (drops all data)
npm run db:reset
```

**Important**: All npm scripts use `NODE_OPTIONS='--require ./node-compat.cjs'` to provide Node.js compatibility in the browser environment. This is required for the virtual file system and Babel transformation.

## Architecture

### Virtual File System

The core of this app is `VirtualFileSystem` (`src/lib/file-system.ts`), an in-memory file system that stores generated React components. No files are written to the actual disk.

- Files are stored as a `Map<string, FileNode>` structure
- Supports standard operations: create, read, update, delete, rename
- Serializes to JSON for persistence in the database (`Project.data` field)
- Used by both the AI (via tools) and the UI (via FileSystemContext)

### AI Integration

The AI chat endpoint (`src/app/api/chat/route.ts`) uses Vercel AI SDK's `streamText` with two custom tools:

1. **`str_replace_editor`** (`src/lib/tools/str-replace.ts`) - Creates/edits files using string replacement, similar to an editor
2. **`file_manager`** (`src/lib/tools/file-manager.ts`) - Renames and deletes files/folders

The AI is instructed via `src/lib/prompts/generation.tsx` to:
- Always create a root `/App.jsx` file as the entry point
- Use Tailwind CSS for styling (not inline styles)
- Import local files using the `@/` alias (e.g., `import Foo from '@/components/Foo'`)
- Operate on the root path `/` of the virtual file system

**Note**: The app works without an `ANTHROPIC_API_KEY` in `.env` - it will return static placeholder code instead of calling the LLM.

### Live Preview System

The preview (`src/components/preview/PreviewFrame.tsx`) transforms JSX/TSX to JavaScript in real-time:

1. Collects all files from the virtual file system
2. Transforms each file using Babel (`src/lib/transform/jsx-transformer.ts`)
3. Creates an import map with blob URLs for each transformed module
4. Generates an HTML document with an import map and renders it in an iframe
5. The entry point is `/App.jsx` (or `/App.tsx`, `/index.jsx`, etc.)

This allows hot-reload preview without a bundler or separate dev server.

### State Management

Two React contexts manage app state:

- **`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`) - Manages the virtual file system, selected file, and file operations
- **`ChatContext`** (`src/lib/contexts/chat-context.tsx`) - Manages chat messages and AI streaming

These are client-side contexts that wrap the main UI components.

### Database & Auth

- **Prisma schema** (`prisma/schema.prisma`) defines the database structure with two models: `User` and `Project`. Always reference this file when you need to understand the structure of data stored in the database.
- **Custom Prisma output**: Generated client lives in `src/generated/prisma` (not default `node_modules`)
- **Projects** store serialized chat messages (`messages` field as JSON) and virtual file system state (`data` field as JSON)
- **Auth** uses JWT with bcrypt password hashing (`src/lib/auth.ts`)
- **Anonymous users** can use the app without signing up - their work is tracked but not persisted

### Routing

- `/` - Main page (new project or anonymous session)
- `/[projectId]` - Load existing project by ID (requires auth)
- `/api/chat` - POST endpoint for AI chat streaming

## Running Tests

Tests use Vitest with React Testing Library. Config is in `vitest.config.mts`. Test files are colocated with source files in `__tests__` directories.

Example test locations:
- `src/components/chat/__tests__/ChatInterface.test.tsx`
- `src/lib/__tests__/file-system.test.ts`
- `src/lib/transform/__tests__/jsx-transformer.test.ts`

To run tests in watch mode during development:
```bash
npx vitest --watch
```

## Key Files to Know

- `src/app/api/chat/route.ts` - AI chat endpoint, tool registration, project persistence
- `src/lib/file-system.ts` - Virtual file system implementation
- `src/lib/transform/jsx-transformer.ts` - Babel-based JSX → JS transformation
- `src/lib/prompts/generation.tsx` - System prompt for the AI
- `src/components/preview/PreviewFrame.tsx` - Live preview iframe renderer
- `node-compat.cjs` - Polyfills for Node.js APIs in browser (required for Turbopack)

## Common Patterns

**Adding a new AI tool**: Create a tool builder function in `src/lib/tools/`, then register it in the `tools` object in `src/app/api/chat/route.ts`.

**Modifying the virtual FS**: Always use the context methods from `useFileSystem()` hook rather than directly calling `VirtualFileSystem` methods, so the UI updates properly.

**Database changes**: After modifying `prisma/schema.prisma`, run:
```bash
npx prisma migrate dev --name your_migration_name
npx prisma generate
```

**Import paths**: This project uses the `@/` alias for all local imports (configured in `tsconfig.json`). Always use `@/lib/...` or `@/components/...` instead of relative paths.

## Coding Style

**Comments**: Use comments sparingly. Only add comments where the logic isn't self-evident or when explaining genuinely complex code.
