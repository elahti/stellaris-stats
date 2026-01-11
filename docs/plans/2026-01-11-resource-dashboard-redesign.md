# Resource Dashboard Redesign

## Overview

Redesign the BudgetDashboard to group resources by Stellaris wiki categories, with improved visualization styling and an interactive legend.

## Resource Categories

Six chart rows, each showing one category:

| Row | Category                     | Resources                                   | Schema Fields                                               |
| --- | ---------------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| 1   | Basic Resources              | Energy, Minerals, Food, Trade               | `energy`, `minerals`, `food`, `trade`                       |
| 2   | Advanced Resources           | Alloys, Consumer Goods                      | `alloys`, `consumerGoods`                                   |
| 3   | Basic Strategic Resources    | Rare Crystals, Exotic Gases, Volatile Motes | `rareCrystals`, `exoticGases`, `volatileMotes`              |
| 4   | Advanced Strategic Resources | Dark Matter, Living Metal, Zro              | `srDarkMatter`, `srLivingMetal`, `srZro`                    |
| 5   | Abstract Resources           | Unity, Influence                            | `unity`, `influence`                                        |
| 6   | Research                     | Physics, Society, Engineering               | `physicsResearch`, `societyResearch`, `engineeringResearch` |

### Missing Data Handling

- Filter out resources with no data across all datapoints (all values `null` or `0`)
- Skip entire category if no resources have data
- Individual datapoints can have missing values (resource acquired later in game)

## Layout Changes

- Remove 2x2 responsive grid layout
- Replace with vertical stack - each chart full width, one per row
- Remove "All Resources" chart completely
- Chart height: 350-400px for readability
- Gap between chart rows for visual separation

## Chart Styling Changes

- Line colors: Use resource color from theme (not gray)
- Keep vertical crosshair line on hover
- X-axis format: `YYYY.MM`
- Data range: First datapoint to latest (no zoom controls)

## Legend Redesign

Position: Below each chart

Layout (one resource per line):

```
[colored box] Resource Name    +430
[colored box] Resource Name    +215
[colored box] Resource Name    -89
```

Behavior:

- When not hovering: Show value from latest datapoint
- When hovering: Show value at hovered timestamp
- Format values with `+` prefix for positive, `-` for negative
- Show `—` for null/missing values at hovered point

## Shared Hover State

- `BudgetDashboard` owns `hoveredIndex` state
- All 6 charts share this state
- Hovering on one chart highlights same timestamp on all charts
- Provides synchronized view across all resource categories

## Theme Colors

Add to `ui/src/styles/theme.css.ts`:

```typescript
// Existing (keep as-is)
energy: '#f4c542',
minerals: '#e63946',
food: '#7cb518',
alloys: '#c77dff',
consumerGoods: '#ff922b',
unity: '#22d3ee',

// Update
influence: '#A64D79',  // was #f97316

// New - Basic
trade: '#8AB8FF',

// New - Strategic Basic
rareCrystals: '#e84393',
exoticGases: '#00cec9',
volatileMotes: '#fdcb6e',

// New - Strategic Advanced
srDarkMatter: '#9B59B6',
srLivingMetal: '#a0a0a0',
srZro: '#5DADE2',

// New - Research
physicsResearch: '#3274A1',
societyResearch: '#55efc4',
engineeringResearch: '#fab1a0',
```

## Component Changes

### TimeSeriesChart

Props update:

```typescript
interface TimeSeriesChartProps {
  title: string
  timestamps: number[]
  series: SeriesConfig[]
  height?: number // default 350-400px
  hoveredIndex: number | null
  onHoverChange: (index: number | null) => void
}
```

Internal changes:

- Render legend below chart (inside component)
- Line colors from series config (resource colors)
- Emit hover index on mouse move over chart
- Show vertical crosshair at hovered position

### ChartLegend (new, internal to TimeSeriesChart)

```typescript
interface ChartLegendProps {
  series: SeriesConfig[]
  hoveredIndex: number | null
  timestamps: number[]
}
```

### BudgetDashboard

- Define `RESOURCE_CATEGORIES` constant with 6 categories
- Add `hoveredIndex` state, pass to all charts
- Filter categories before rendering:
  1. For each resource in category, check if any non-null value exists
  2. If no resources have data, skip category
- Render charts in vertical stack (not grid)

### CSS Changes

BudgetDashboard.css.ts:

- Replace `chartsGrid` with vertical flex/stack layout

TimeSeriesChart.css.ts:

- Add legend styles (vertical list, colored boxes, right-aligned values)
- Monospace/tabular numbers for value alignment

## Files to Modify

| File                                                 | Changes                                                       |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| `ui/src/styles/theme.css.ts`                         | Add 11 new resource colors, update influence                  |
| `ui/src/components/BudgetDashboard.tsx`              | Category definitions, vertical layout, hover state, filtering |
| `ui/src/components/BudgetDashboard.css.ts`           | Replace grid with vertical stack                              |
| `ui/src/components/TimeSeriesChart.tsx`              | Integrated legend, hover props, line colors                   |
| `ui/src/components/TimeSeriesChart.css.ts`           | Legend styles                                                 |
| `ui/playwright/tests/save-selection.spec.ts`         | Update assertions, add tests                                  |
| `ui/playwright/fixtures/single-save-with-budget.sql` | Add strategic/research data                                   |

## Test Updates

### Update Existing Tests

`save-selection.spec.ts`:

- Change chart title assertions:
  - `Primary Resources` → `Basic Resources`
  - `Secondary Resources` → `Advanced Resources`
  - `Advanced Resources` → `Abstract Resources`
  - Remove `All Resources` assertion
- Add assertions for new sections (if fixture has data)

### New Tests

- Empty category filtering: Verify categories without data don't render
- Legend value display: Check values appear in legend

### Fixture Updates

`single-save-with-budget.sql`:

- Add budget data for strategic resources (rareCrystals, exoticGases, volatileMotes)
- Add budget data for advanced strategic (srDarkMatter, srLivingMetal, srZro)
- Add budget data for research (physicsResearch, societyResearch, engineeringResearch)

## Implementation Order

1. Theme colors (foundation)
2. TimeSeriesChart changes (legend, styling, hover callbacks)
3. BudgetDashboard changes (categories, layout, hover state, filtering)
4. CSS updates
5. Tests and fixtures
