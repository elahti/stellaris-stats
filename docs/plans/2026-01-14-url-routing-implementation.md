# URL Routing Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add TanStack Router to enable URL-based navigation that persists across page refreshes.

**Architecture:** File-based routing with TanStack Router. Root layout contains save sidebar + view menu + outlet. Routes define path params (`$saveId`) and Zod-validated search params (`category`). State moves from React useState to URL.

**Tech Stack:** TanStack Router, @tanstack/router-zod-adapter, Zod, vanilla-extract for styling.

---

## Task 1: Install Dependencies

**Files:**

- Modify: `ui/package.json`

**Step 1: Install TanStack Router packages**

Run:

```bash
cd ui && npm install @tanstack/react-router @tanstack/router-zod-adapter
```

**Step 2: Install Vite plugin as dev dependency**

Run:

```bash
cd ui && npm install -D @tanstack/router-plugin
```

**Step 3: Verify installation**

Run: `cd ui && npm ls @tanstack/react-router`
Expected: Shows installed version

**Step 4: Commit**

```bash
git add ui/package.json ui/package-lock.json
git commit -m "build: add TanStack Router dependencies"
```

---

## Task 2: Configure Vite Plugin

**Files:**

- Modify: `ui/vite.config.ts`

**Step 1: Update vite.config.ts with router plugin**

Add TanStack Router plugin before react plugin:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import z from 'zod/v4'

const ViteEnvConfig = z.object({
  serverPort: z.coerce.number().default(5173),
  graphqlServerPort: z.coerce.number().default(4000),
})

const envConfig = ViteEnvConfig.parse({
  serverPort: process.env.STELLARIS_STATS_VITE_PORT,
  graphqlServerPort: process.env.STELLARIS_STATS_GRAPHQL_SERVER_PORT,
})

const graphqlUrl = `http://localhost:${envConfig.graphqlServerPort}`

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    vanillaExtractPlugin(),
  ],
  server: {
    port: envConfig.serverPort,
    host: true,
    proxy: {
      '/graphql': graphqlUrl,
      '/api': graphqlUrl,
    },
  },
})
```

**Step 2: Verify dev server starts (will fail until routes exist)**

Run: `cd ui && npm run dev`
Expected: Warning about missing routes directory (this is expected)

**Step 3: Commit**

```bash
git add ui/vite.config.ts
git commit -m "build: configure TanStack Router Vite plugin"
```

---

## Task 3: Create Route Directory Structure

**Files:**

- Create: `ui/src/routes/__root.tsx` (placeholder)
- Create: `ui/src/routes/index.tsx` (placeholder)

**Step 1: Create routes directory and placeholder root**

Create `ui/src/routes/__root.tsx`:

```typescript
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => <Outlet />,
})
```

**Step 2: Create placeholder index route**

Create `ui/src/routes/index.tsx`:

```typescript
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: () => <div>Placeholder</div>,
})
```

**Step 3: Run dev server to generate routeTree**

Run: `cd ui && npm run dev`
Expected: Creates `ui/src/routeTree.gen.ts` automatically

**Step 4: Verify routeTree.gen.ts was created**

Run: `ls -la ui/src/routeTree.gen.ts`
Expected: File exists

**Step 5: Commit**

```bash
git add ui/src/routes/ ui/src/routeTree.gen.ts
git commit -m "feat: add TanStack Router route structure"
```

---

## Task 4: Create View Menu Sidebar Component

**Files:**

- Create: `ui/src/components/ViewMenu.css.ts`
- Create: `ui/src/components/ViewMenu.tsx`
- Modify: `ui/src/components/index.ts`

**Step 1: Create ViewMenu styles**

Create `ui/src/components/ViewMenu.css.ts`:

```typescript
import { style } from '@vanilla-extract/css'
import { vars } from '../styles/theme.css'

export const viewMenuContainer = style({
  display: 'flex',
  flexDirection: 'column',
  padding: vars.space.md,
  width: '160px',
  flexShrink: 0,
  borderRight: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.background,
})

export const viewMenuTitle = style({
  fontFamily: vars.font.title,
  fontSize: '0.875rem',
  color: vars.color.primary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  margin: 0,
  marginBottom: vars.space.md,
})

export const viewMenuItem = style({
  'display': 'flex',
  'alignItems': 'center',
  'gap': vars.space.sm,
  'padding': '10px 12px',
  'borderRadius': vars.radius.sm,
  'cursor': 'pointer',
  'fontFamily': vars.font.menu,
  'fontSize': '13px',
  'color': vars.color.textMuted,
  'textDecoration': 'none',
  'transition': 'all 0.2s',
  ':hover': {
    backgroundColor: vars.color.surfaceHover,
    color: vars.color.text,
  },
})

export const viewMenuItemActive = style({
  backgroundColor: vars.color.surface,
  color: vars.color.text,
})

export const viewMenuIcon = style({
  width: '16px',
  height: '16px',
  opacity: 0.7,
  flexShrink: 0,
})
```

**Step 2: Create ViewMenu component**

Create `ui/src/components/ViewMenu.tsx`:

```typescript
import { Link, useParams } from '@tanstack/react-router'
import * as styles from './ViewMenu.css'

export const ViewMenu = (): React.ReactElement => {
  const params = useParams({ strict: false })
  const saveId = params.saveId

  if (!saveId) {
    return <></>
  }

  return (
    <nav className={styles.viewMenuContainer}>
      <h2 className={styles.viewMenuTitle}>Views</h2>
      <Link
        to="/saves/$saveId/empire_budget"
        params={{ saveId }}
        className={styles.viewMenuItem}
        activeProps={{ className: `${styles.viewMenuItem} ${styles.viewMenuItemActive}` }}
      >
        <svg className={styles.viewMenuIcon} viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
        </svg>
        Empire Budget
      </Link>
    </nav>
  )
}
```

**Step 3: Export ViewMenu from components index**

Modify `ui/src/components/index.ts` to add:

```typescript
export { ViewMenu } from './ViewMenu'
```

**Step 4: Verify build passes**

Run: `cd ui && npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add ui/src/components/ViewMenu.tsx ui/src/components/ViewMenu.css.ts ui/src/components/index.ts
git commit -m "feat: add ViewMenu sidebar component"
```

---

## Task 5: Create Splash Screen Styles

**Files:**

- Create: `ui/src/components/SplashScreen.css.ts`
- Create: `ui/src/components/SplashScreen.tsx`
- Modify: `ui/src/components/index.ts`

**Step 1: Create SplashScreen styles**

Create `ui/src/components/SplashScreen.css.ts`:

```typescript
import { style } from '@vanilla-extract/css'
import { vars } from '../styles/theme.css'

export const splashContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: vars.space.xl,
  textAlign: 'center',
})

export const splashTitle = style({
  fontFamily: vars.font.title,
  fontSize: '4.5rem',
  fontWeight: 700,
  color: vars.color.primary,
  textTransform: 'uppercase',
  letterSpacing: '8px',
  textShadow: `0 0 40px ${vars.color.primaryGlow}`,
  margin: 0,
  marginBottom: vars.space.md,
})

export const splashSubtitle = style({
  fontFamily: vars.font.body,
  fontSize: '1rem',
  color: vars.color.textMuted,
  letterSpacing: '2px',
  textTransform: 'uppercase',
})
```

**Step 2: Create SplashScreen component**

Create `ui/src/components/SplashScreen.tsx`:

```typescript
import * as styles from './SplashScreen.css'

export const SplashScreen = (): React.ReactElement => (
  <div className={styles.splashContainer}>
    <h1 className={styles.splashTitle}>Stellaris Stats</h1>
    <p className={styles.splashSubtitle}>Select a save to begin</p>
  </div>
)
```

**Step 3: Export SplashScreen from components index**

Add to `ui/src/components/index.ts`:

```typescript
export { SplashScreen } from './SplashScreen'
```

**Step 4: Commit**

```bash
git add ui/src/components/SplashScreen.tsx ui/src/components/SplashScreen.css.ts ui/src/components/index.ts
git commit -m "feat: add SplashScreen component"
```

---

## Task 6: Update SaveList to Use Router Links

**Files:**

- Modify: `ui/src/components/SaveList.tsx`

**Step 1: Update SaveList to use Link instead of onClick**

Replace `ui/src/components/SaveList.tsx`:

```typescript
import { useQuery } from '@apollo/client/react'
import { Link, useParams } from '@tanstack/react-router'
import { GetSavesDocument } from '../graphql/generated/graphql'
import * as styles from './SaveList.css'

export const SaveList = (): React.ReactElement => {
  const { data, loading, error } = useQuery(GetSavesDocument)
  const params = useParams({ strict: false })
  const selectedFilename = params.saveId

  if (loading) {
    return <div className={styles.loadingText}>Loading saves...</div>
  }

  if (error) {
    return <div className={styles.errorText}>Error: {error.message}</div>
  }

  const saves = data?.saves ?? []

  return (
    <div className={styles.saveListContainer}>
      <h2 className={styles.saveListTitle}>Saves</h2>
      {saves.map((save) => (
        <Link
          key={save.saveId}
          to="/saves/$saveId/empire_budget"
          params={{ saveId: save.filename }}
          className={`${styles.saveItem} ${
            selectedFilename === save.filename ? styles.saveItemSelected : ''
          }`}
        >
          <h3 className={styles.saveName}>{save.name}</h3>
          <p className={styles.saveFilename}>{save.filename}</p>
        </Link>
      ))}
    </div>
  )
}

// Keep interface for backwards compatibility during transition
export interface SaveListProps {
  selectedFilename?: string
  onSelectSave?: (filename: string) => void
}
```

**Step 2: Update SaveList.css.ts to handle Link styling and single-line text**

Ensure `saveItem` has `textDecoration: 'none'` and add `whiteSpace: 'nowrap'` to `saveName` and `saveFilename`:

```typescript
export const saveItem = style({
  'display': 'flex',
  'flexDirection': 'column',
  'gap': vars.space.xs,
  'padding': vars.space.md,
  'backgroundColor': vars.color.surface,
  'border': `1px solid ${vars.color.border}`,
  'borderRadius': vars.radius.sm,
  'cursor': 'pointer',
  'transition': 'all 0.2s ease',
  'textDecoration': 'none',
  ':hover': {
    backgroundColor: vars.color.surfaceHover,
    borderColor: vars.color.borderBright,
    boxShadow: vars.shadow.glow,
  },
})

export const saveName = style({
  fontFamily: vars.font.menu,
  fontSize: '1.1rem',
  color: vars.color.text,
  margin: 0,
  whiteSpace: 'nowrap',
})

export const saveFilename = style({
  fontFamily: vars.font.body,
  fontSize: '0.85rem',
  color: vars.color.textMuted,
  margin: 0,
  whiteSpace: 'nowrap',
})
```

**Step 3: Commit**

```bash
git add ui/src/components/SaveList.tsx ui/src/components/SaveList.css.ts
git commit -m "refactor: update SaveList to use router Link"
```

---

## Task 7: Create Empire Budget Route with Search Params

**Files:**

- Create: `ui/src/routes/saves/$saveId/empire_budget.tsx`

**Step 1: Create the route file with Zod validation**

Create directories and file `ui/src/routes/saves/$saveId/empire_budget.tsx`:

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { zodSearchValidator } from '@tanstack/router-zod-adapter'
import { BudgetDashboard } from '../../../components'

const categories = [
  'basic',
  'advanced',
  'basic_strategic',
  'advanced_strategic',
  'abstract',
  'research',
] as const

const searchSchema = z.object({
  category: z.enum(categories).catch('basic'),
})

export const Route = createFileRoute('/saves/$saveId/empire_budget')({
  validateSearch: zodSearchValidator(searchSchema),
  component: EmpireBudgetPage,
})

function EmpireBudgetPage(): React.ReactElement {
  const { saveId } = Route.useParams()
  const { category } = Route.useSearch()

  return <BudgetDashboard filename={saveId} initialCategory={category} />
}
```

**Step 2: Restart dev server to regenerate routeTree**

Run: `cd ui && npm run dev`
Expected: routeTree.gen.ts updated with new route

**Step 3: Commit**

```bash
git add ui/src/routes/saves/
git commit -m "feat: add empire_budget route with Zod search params"
```

---

## Task 8: Update BudgetDashboard to Accept Category Prop

**Files:**

- Modify: `ui/src/components/BudgetDashboard.tsx`

**Step 1: Add initialCategory prop and sync with URL**

Update the props interface and component in `ui/src/components/BudgetDashboard.tsx`:

```typescript
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { chartColors } from '../styles/theme.css'
import { useRealtimeBudget } from '../hooks/useRealtimeBudget'
import { TimeSeriesChart, SeriesConfig } from './TimeSeriesChart'
import type { BudgetEntry } from '../graphql/generated/graphql'
import * as styles from './BudgetDashboard.css'

export interface BudgetDashboardProps {
  filename: string
  initialCategory?: string
}

// ... keep RESOURCE_CATEGORIES, getResourceValue, hasAnyData unchanged ...

export const BudgetDashboard = ({
  filename,
  initialCategory,
}: BudgetDashboardProps): React.ReactElement => {
  const { gamestates, loading, error, saveName } = useRealtimeBudget(filename)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [hiddenResources, setHiddenResources] = useState<Set<string>>(new Set())
  const navigate = useNavigate()

  // Map URL category to display title
  const categoryKeyToTitle: Record<string, string> = {
    basic: 'Basic Resources',
    advanced: 'Advanced Resources',
    basic_strategic: 'Basic Strategic Resources',
    advanced_strategic: 'Advanced Strategic Resources',
    abstract: 'Abstract Resources',
    research: 'Research',
  }

  const categoryTitleToKey: Record<string, string> = {
    'Basic Resources': 'basic',
    'Advanced Resources': 'advanced',
    'Basic Strategic Resources': 'basic_strategic',
    'Advanced Strategic Resources': 'advanced_strategic',
    'Abstract Resources': 'abstract',
    'Research': 'research',
  }

  const chartData = useMemo(() => {
    // ... existing chartData logic unchanged ...
  }, [gamestates])

  // Derive selectedCategory from initialCategory or first available
  const selectedCategory = useMemo(() => {
    if (initialCategory && categoryKeyToTitle[initialCategory]) {
      return categoryKeyToTitle[initialCategory]
    }
    return chartData?.categories[0]?.title ?? null
  }, [initialCategory, chartData])

  useEffect(() => {
    setHiddenResources(new Set())
  }, [selectedCategory])

  const handleCategoryChange = (title: string) => {
    const key = categoryTitleToKey[title] ?? 'basic'
    navigate({
      to: '/saves/$saveId/empire_budget',
      params: { saveId: filename },
      search: { category: key },
    })
  }

  // ... rest of component with handleCategoryChange used in tab onClick ...
}
```

Note: The full implementation requires careful integration. The key changes are:

1. Accept `initialCategory` prop
2. Use `useNavigate` to update URL on category change
3. Map between URL keys and display titles

**Step 2: Verify build passes**

Run: `cd ui && npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add ui/src/components/BudgetDashboard.tsx
git commit -m "feat: sync BudgetDashboard category with URL"
```

---

## Task 9: Create Root Layout Route

**Files:**

- Modify: `ui/src/routes/__root.tsx`
- Modify: `ui/src/App.css.ts`

**Step 1: Update root route with full layout**

Replace `ui/src/routes/__root.tsx`:

```typescript
import { createRootRoute, Outlet } from '@tanstack/react-router'
import '../styles/global.css'
import { themeClass } from '../styles/theme.css'
import { SaveList, ViewMenu } from '../components'
import * as styles from '../App.css'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout(): React.ReactElement {
  return (
    <div className={`${themeClass} ${styles.appContainer}`}>
      <aside className={styles.saveSidebar}>
        <SaveList />
      </aside>
      <ViewMenu />
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  )
}
```

**Step 2: Update App.css.ts for new layout**

Replace `ui/src/App.css.ts`:

```typescript
import { style } from '@vanilla-extract/css'
import { vars } from './styles/theme.css'

export const appContainer = style({
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
  backgroundColor: vars.color.background,
})

export const saveSidebar = style({
  width: 'fit-content',
  flexShrink: 0,
  borderRight: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.surface,
  overflowY: 'auto',
})

export const mainContent = style({
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
})
```

**Step 3: Commit**

```bash
git add ui/src/routes/__root.tsx ui/src/App.css.ts
git commit -m "feat: implement root layout with sidebars"
```

---

## Task 10: Update Index Route with Splash Screen

**Files:**

- Modify: `ui/src/routes/index.tsx`

**Step 1: Update index route to show splash screen**

Replace `ui/src/routes/index.tsx`:

```typescript
import { createFileRoute } from '@tanstack/react-router'
import { SplashScreen } from '../components'

export const Route = createFileRoute('/')({
  component: SplashScreen,
})
```

**Step 2: Commit**

```bash
git add ui/src/routes/index.tsx
git commit -m "feat: add splash screen to index route"
```

---

## Task 11: Update App.tsx and main.tsx for Router

**Files:**

- Modify: `ui/src/App.tsx`
- Modify: `ui/src/main.tsx`

**Step 1: Simplify App.tsx to just export router**

Replace `ui/src/App.tsx`:

```typescript
import { createRouter, RouterProvider } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export const App = (): React.ReactElement => <RouterProvider router={router} />
```

**Step 2: Verify main.tsx works (should need no changes)**

Current `main.tsx` already wraps App with ApolloProvider, which is correct.

**Step 3: Run dev server and test navigation**

Run: `cd ui && npm run dev`
Expected: App loads, shows splash screen at `/`, clicking save navigates to `/saves/{id}/empire_budget`

**Step 4: Commit**

```bash
git add ui/src/App.tsx
git commit -m "refactor: integrate RouterProvider in App"
```

---

## Task 12: Run Full Build and Lint

**Files:** None (verification only)

**Step 1: Run TypeScript build**

Run: `npm run ui:build`
Expected: Build succeeds with no errors

**Step 2: Run linter**

Run: `npm run lint:typescript`
Expected: No lint errors

**Step 3: Fix any issues**

If errors, fix them and commit fixes.

---

## Task 13: Update E2E Tests for New URL Structure

**Files:**

- Modify: `ui/playwright/tests/*.spec.ts`

**Step 1: Review existing E2E tests**

Run: `ls ui/playwright/tests/`
Check which tests need URL updates.

**Step 2: Update tests to navigate via URL**

Tests should now navigate directly to URLs like:

- `/` for splash screen
- `/saves/{saveId}/empire_budget` for budget view

Update navigation patterns from clicking saves to direct URL navigation where appropriate.

**Step 3: Run E2E tests**

Run: `npm run test:ci:e2e`
Expected: All tests pass

**Step 4: Commit**

```bash
git add ui/playwright/
git commit -m "test: update E2E tests for URL routing"
```

---

## Task 14: Final Verification and Cleanup

**Step 1: Remove unused exports from SaveList**

Remove the deprecated `SaveListProps` interface if no longer needed elsewhere.

**Step 2: Delete old welcome styles from App.css.ts**

Remove `welcomeContainer`, `welcomeTitle`, `welcomeText` if they exist (moved to SplashScreen).

**Step 3: Run full test suite**

Run:

```bash
npm run lint:typescript && npm run build && npm run test:ci:typescript
```

Expected: All pass

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: cleanup after URL routing migration"
```

---

## Summary

| Task | Description                   | Files Changed                          |
| ---- | ----------------------------- | -------------------------------------- |
| 1    | Install dependencies          | package.json                           |
| 2    | Configure Vite plugin         | vite.config.ts                         |
| 3    | Create route structure        | routes/\_\_root.tsx, routes/index.tsx  |
| 4    | Create ViewMenu component     | ViewMenu.tsx, ViewMenu.css.ts          |
| 5    | Create SplashScreen component | SplashScreen.tsx, SplashScreen.css.ts  |
| 6    | Update SaveList for routing   | SaveList.tsx, SaveList.css.ts          |
| 7    | Create empire_budget route    | routes/saves/$saveId/empire_budget.tsx |
| 8    | Update BudgetDashboard        | BudgetDashboard.tsx                    |
| 9    | Create root layout            | routes/\_\_root.tsx, App.css.ts        |
| 10   | Update index route            | routes/index.tsx                       |
| 11   | Integrate router in App       | App.tsx                                |
| 12   | Build verification            | (none)                                 |
| 13   | Update E2E tests              | playwright/tests/\*.spec.ts            |
| 14   | Cleanup                       | Various                                |
