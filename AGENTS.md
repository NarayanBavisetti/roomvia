# Agent Guidelines for Roomvia Landing

## Build/Lint/Test Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production bundle with Turbopack
- `npm run start` - Start production server

### Code Quality
- `npm run lint` - Run ESLint with Next.js configuration
- **No test framework configured** - Add Jest/Cypress if needed

### Single Test Execution
- No test runner configured - implement with `npm test <test-file>` if adding tests

## Code Style Guidelines

### TypeScript Configuration
- Strict mode enabled
- Target: ES2017
- Module resolution: bundler
- Path aliases: `@/*` → `./src/*`

### Import Organization
```typescript
// React imports first
import * as React from "react"
import { useState, useEffect } from "react"

// External libraries
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"

// Internal imports (hooks, components, utils)
import { useFlatsData } from "@/hooks/useFlatsData"
import type { Flat } from "@/lib/supabase"
```

### Naming Conventions
- **Components**: PascalCase (`FlatCard`, `SearchBar`)
- **Hooks**: camelCase with `use` prefix (`useFlatsData`, `useInfiniteScroll`)
- **Files**: kebab-case for components (`flat-card.tsx`), camelCase for hooks/utilities (`useFlatsData.ts`)
- **Functions**: camelCase (`handleSearch`, `applyFilters`)
- **Variables**: camelCase (`searchLocation`, `activeFilters`)
- **Types/Interfaces**: PascalCase (`UseFlatsDataReturn`, `Flat`)

### React Patterns
- Use functional components with hooks
- Prefer custom hooks for complex logic
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive computations
- Handle hydration with `useState` mounted pattern
- Use `'use client'` directive for client components

### Styling
- Tailwind CSS with custom purple color palette
- Use `cn()` utility from `@/lib/utils` for conditional classes
- Follow mobile-first responsive design
- Use CSS variables for theme colors
- Prefer utility classes over custom CSS

### Error Handling
- Use try/catch blocks with descriptive error messages
- Log errors with `console.error`
- Show user-friendly error states in UI
- Handle async operations with loading/error states

### File Structure
```
src/
├── app/           # Next.js App Router pages
├── components/    # Reusable UI components
│   ├── ui/       # Base UI components (shadcn/ui)
│   └── ...       # Feature-specific components
├── hooks/        # Custom React hooks
├── lib/          # Utilities and configurations
└── providers/    # React context providers
```

### Performance
- Implement proper memoization with `useMemo`/`useCallback`
- Use infinite scroll for large lists
- Cache API responses appropriately
- Lazy load components when beneficial
- Optimize images with Next.js Image component

### Security
- Never commit secrets or API keys
- Use environment variables for sensitive data
- Validate user inputs on both client and server
- Implement proper authentication flows
- Follow Next.js security best practices

### Database
- Use Supabase for data operations
- Implement proper error handling for database queries
- Use TypeScript interfaces for database types
- Follow database schema conventions

### API Routes
- Use Next.js API routes in `src/app/api/`
- Implement proper error handling and status codes
- Use TypeScript for request/response types
- Follow RESTful conventions where applicable