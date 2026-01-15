# UI Architecture

React frontend for Stellaris statistics with real-time updates via GraphQL subscriptions.

## Design-First Workflow

Before implementing any UI changes:

1. **Establish mutual understanding** with the user about page layout and components
2. **Update component specs** in `docs/components/` to document the agreed design
3. **Get user approval** on the specs before writing implementation code

The HTML components in `docs/components/` are the **source of truth**. Implementation must match them exactly. Never skip the design phase.

## Implementation Verification

After implementing UI changes, always verify visually:

1. **Check first**: Dev server is usually already running at `http://localhost:5173`—don't start without checking
2. **Verify with browser**: Use Playwright tools (`browser_navigate`, `browser_snapshot`) to confirm changes
3. **Never assume**: Visual bugs are common—always verify implementation matches specs

## Tech Stack

- **React 19** + **Vite** + **TypeScript** (strict mode)
- **vanilla-extract** for type-safe CSS-in-JS styling
- **Apollo Client** with graphql-ws for queries/mutations and WebSocket subscriptions
- **uPlot** for high-performance time-series charts

## File Organization

Components live in `ui/src/components/` with co-located `.css.ts` style files (vanilla-extract). Each component follows the `ComponentName.tsx` + `ComponentName.css.ts` naming pattern.

GraphQL operations are defined in `ui/src/graphql/*.graphql` with generated types output to `ui/src/graphql/generated/`.

Custom hooks live in `ui/src/hooks/`. The Apollo Client configuration is in `ui/src/lib/apollo.ts`.

Theme tokens and global styles are in `ui/src/styles/`:

- `theme.css.ts` — Theme variables (`vars.color`, `vars.space`, etc.)
- `global.css.ts` — Global styles applied to the app

Use `vars` from `theme.css.ts` for all styling values (never hardcode colors or spacing).

## Key Components

### SaveList

Displays available saves and handles selection. Uses `GetSavesDocument` query.

```typescript
interface SaveListProps {
  selectedFilename?: string
  onSelectSave: (filename: string) => void
}
```

### BudgetDashboard

Main dashboard rendering resource charts. Consumes `useRealtimeBudget` hook and renders multiple `TimeSeriesChart` components grouped by resource type (primary, secondary, advanced).

### TimeSeriesChart

Generic uPlot wrapper for time-series visualization. Handles chart initialization, data updates, and responsive resizing.

```typescript
interface TimeSeriesChartProps {
  timestamps: number[]
  series: SeriesConfig[]
  title: string
  height?: number
}
```

## Data Flow

### Apollo Client Setup (`lib/apollo.ts`)

Split link configuration:

- **HTTP link** for queries/mutations → `/graphql`
- **WebSocket link** for subscriptions → `ws://{host}/graphql`

```typescript
const splitLink = split(
  ({ operationType }) => operationType === OperationTypeNode.SUBSCRIPTION,
  wsLink,
  httpLink,
)
```

### Real-time Updates (`useRealtimeBudget`)

1. Initial data fetched via `GetBudgetDocument` query
2. Subscribes to `OnGamestateCreatedDocument` for new gamestates
3. Appends new data to local state on subscription events

```typescript
const { gamestates, loading, error, saveName, saveId } =
  useRealtimeBudget(filename)
```

State is managed locally (not in Apollo cache) because uPlot needs array format and appending is simpler than cache merge policies.

### GraphQL Operations

**Queries** (`graphql/queries.graphql`):

- `GetSaves` - List all saves
- `GetSave` - Get save details with gamestates
- `GetBudget` - Get budget totals for charting

**Subscriptions** (`graphql/subscriptions.graphql`):

- `OnGamestateCreated` - Real-time new gamestate notifications

## Theming System

### Theme Tokens (`styles/theme.css.ts`)

Uses vanilla-extract `createTheme` for type-safe CSS variables:

```typescript
export const [themeClass, vars] = createTheme({
  color: {
    // Backgrounds
    void: '#05080a',
    background: '#0c1014',
    surface: 'rgba(20, 30, 40, 0.85)',
    // Accents
    primary: '#00e696',
    secondary: '#4a9eff',
    // Resources (Stellaris-themed)
    energy: '#f4c542',
    minerals: '#e63946',
    food: '#7cb518',
    alloys: '#c77dff',
    // ...
  },
  font: {
    menu: '"Jura", sans-serif',
    title: '"Orbitron", sans-serif',
    body: '"Century Gothic", "Segoe UI", sans-serif',
  },
  space: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  radius: { sm: '4px', md: '8px' },
  shadow: { panel: '...', glow: '...' },
})
```

### Adding Colors

Add to `vars.color` in `theme.css.ts`, then reference via `vars.color.newColor` in component styles.

### Panel Style

Reusable container style with blur effect:

```typescript
export const panel = style({
  backgroundColor: vars.color.surface,
  border: `1px solid ${vars.color.border}`,
  boxShadow: vars.shadow.panel,
  backdropFilter: 'blur(8px)',
  borderRadius: vars.radius.sm,
})
```

## Conventions

### State Management

- Use React state + Apollo Client cache (no Redux/Zustand)
- Local state for chart data that needs array format
- Apollo cache for entity data (saves, gamestates)

### Styling

- All styles via vanilla-extract (no CSS files, no inline styles)
- Component styles in `ComponentName.css.ts` co-located with component
- Use `vars` for all theme values (never hardcode colors/spacing)

### Subscriptions

- Use for real-time features only (parser notifications)
- Initial data always fetched via query first
- Subscription appends to existing data

### Component Specifications

When creating or modifying UI components, maintain corresponding specification files in `docs/components/`:

- **`docs/components/index.html`** — Index page linking to all component specs
- **`docs/components/<component-name>.html`** — Individual component specification

Each component spec should include:

- Visual preview of all states (default, hover, active, disabled, etc.)
- Detailed specifications table (dimensions, colors, spacing, typography)
- In-context preview showing the component within its layout

This serves as a design reference and enables validation of styling before implementation. Keep specs in sync when changing component styles.

### GraphQL

- Operations defined in `.graphql` files
- Types generated via `npm run ui:codegen`
- Import generated document constants (e.g., `GetBudgetDocument`)

## E2E Testing

End-to-end tests use Playwright to test the full application stack.

### Running Tests

```bash
# Run all E2E tests (from workspace root)
npm run test:ci:e2e

# Run E2E tests with UI mode (from workspace root)
npm run test:e2e:ui -w ui
```

### Test File Structure

```
ui/playwright/
├── tests/                # Test files
│   ├── navigation.spec.ts
│   ├── save-selection.spec.ts
│   └── error-handling.spec.ts
├── fixtures/
│   ├── test-base.ts      # Custom test fixture with database helpers
│   └── sql/              # SQL fixture files
│       ├── empty-database.sql
│       ├── single-save-with-budget.sql
│       └── multiple-saves.sql
├── global-setup.ts       # Creates test database, starts GraphQL server
├── global-teardown.ts    # Cleanup
└── config.ts             # Environment configuration
```

### Database Setup Pattern

Tests use a template database approach for fast setup:

1. **Global setup** creates a template database with migrations applied
2. **Test database** is cloned from the template before tests run
3. **Fixtures** load specific SQL data per test

```typescript
import { test, expect } from '../fixtures/test-base'

test('displays saves', async ({ page, loadFixture }) => {
  await loadFixture('multiple-saves.sql')
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Saves' })).toBeVisible()
})
```

### Available Fixture Helpers

The custom test fixture (`test-base.ts`) provides:

- `loadFixture(path)` - Truncates tables and loads SQL fixture file
- `resetDatabase()` - Truncates all tables without loading data

### Writing Tests

- Use semantic locators (`getByRole`, `getByText`) over CSS selectors
- Load appropriate SQL fixtures before each test
- Use `test.describe` blocks to group related tests
- Avoid strict mode violations by scoping locators (e.g., `sidebar.getByRole(...)`)
