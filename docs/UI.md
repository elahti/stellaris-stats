# UI Architecture

React frontend for Stellaris statistics with real-time updates via GraphQL subscriptions.

## Tech Stack

- **React 19** + **Vite** + **TypeScript** (strict mode)
- **vanilla-extract** for type-safe CSS-in-JS styling
- **Apollo Client** with graphql-ws for queries/mutations and WebSocket subscriptions
- **uPlot** for high-performance time-series charts

## File Structure

```
ui/src/
├── main.tsx              # Entry point, Apollo Provider setup
├── App.tsx               # Root component with layout
├── components/           # React components
│   ├── SaveList.tsx      # Lists saves, handles selection
│   ├── BudgetDashboard.tsx  # Main dashboard with charts
│   └── TimeSeriesChart.tsx  # uPlot wrapper component
├── hooks/                # Custom hooks
│   └── useRealtimeBudget.ts  # Fetches + subscribes to budget data
├── graphql/              # GraphQL operations
│   ├── queries.graphql   # Query definitions
│   ├── subscriptions.graphql  # Subscription definitions
│   └── generated/        # Codegen output (gql.ts, graphql.ts)
├── styles/               # Theme and global styles
│   ├── theme.css.ts      # Theme tokens (colors, fonts, spacing)
│   └── global.css.ts     # Global styles
└── lib/
    └── apollo.ts         # Apollo Client configuration
```

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
const { gamestates, loading, error, saveName, saveId } = useRealtimeBudget(filename)
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

### GraphQL

- Operations defined in `.graphql` files
- Types generated via `npm run ui:codegen`
- Import generated document constants (e.g., `GetBudgetDocument`)
