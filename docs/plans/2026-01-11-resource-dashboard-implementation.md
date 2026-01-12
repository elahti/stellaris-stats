# Resource Dashboard Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the BudgetDashboard to group resources by Stellaris wiki categories with interactive legends and synchronized hover state.

**Architecture:** Modify TimeSeriesChart to include an interactive legend that shows values on hover. BudgetDashboard manages shared hover state across 6 category charts rendered in a vertical stack. Categories with no data are filtered out.

**Tech Stack:** React, TypeScript, vanilla-extract CSS, uPlot charting library

---

## Task 1: Add Theme Colors

**Files:**

- Modify: `ui/src/styles/theme.css.ts`

**Step 1: Add new resource colors to theme**

In `ui/src/styles/theme.css.ts`, update the color section within `createTheme()`:

```typescript
// Resources (update influence, add new colors)
energy: '#f4c542',
minerals: '#e63946',
food: '#7cb518',
alloys: '#c77dff',
consumerGoods: '#ff922b',
unity: '#22d3ee',
influence: '#A64D79',
trade: '#8AB8FF',
rareCrystals: '#e84393',
exoticGases: '#00cec9',
volatileMotes: '#fdcb6e',
srDarkMatter: '#9B59B6',
srLivingMetal: '#a0a0a0',
srZro: '#5DADE2',
physicsResearch: '#3274A1',
societyResearch: '#55efc4',
engineeringResearch: '#fab1a0',
```

**Step 2: Verify build passes**

Run: `npm run ui:build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add ui/src/styles/theme.css.ts
git commit -m "feat(ui): add theme colors for all resource types"
```

---

## Task 2: Update TimeSeriesChart CSS for New Legend

**Files:**

- Modify: `ui/src/components/TimeSeriesChart.css.ts`

**Step 1: Replace legend styles for vertical layout with values**

Replace the existing `legend`, `legendItem`, and `legendColor` styles in `ui/src/components/TimeSeriesChart.css.ts`:

```typescript
import { style } from '@vanilla-extract/css'
import { vars } from '../styles/theme.css'

export const chartContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  padding: vars.space.md,
  backgroundColor: vars.color.surface,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  boxShadow: vars.shadow.panel,
})

export const chartTitle = style({
  fontFamily: vars.font.heading,
  fontSize: '1.1rem',
  color: vars.color.text,
  margin: 0,
})

export const chartWrapper = style({
  position: 'relative',
  width: '100%',
})

export const legend = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.xs,
  padding: vars.space.sm,
})

export const legendItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.space.sm,
  fontFamily: vars.font.body,
  fontSize: '0.85rem',
  color: vars.color.text,
})

export const legendColor = style({
  width: '12px',
  height: '12px',
  borderRadius: '2px',
  flexShrink: 0,
})

export const legendLabel = style({
  flex: 1,
})

export const legendValue = style({
  fontFamily: 'monospace',
  fontSize: '0.85rem',
  color: vars.color.text,
  minWidth: '80px',
  textAlign: 'right',
})
```

**Step 2: Verify build passes**

Run: `npm run ui:build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add ui/src/components/TimeSeriesChart.css.ts
git commit -m "feat(ui): update chart legend styles for vertical layout with values"
```

---

## Task 3: Update TimeSeriesChart Component

**Files:**

- Modify: `ui/src/components/TimeSeriesChart.tsx`

**Step 1: Update props interface and add hover handling**

Replace the entire `ui/src/components/TimeSeriesChart.tsx` file:

```typescript
import { useEffect, useRef, useCallback } from 'react'
import uPlot from 'uplot'
import 'uplot/dist/uPlot.min.css'
import { vars } from '../styles/theme.css'
import * as styles from './TimeSeriesChart.css'

export interface SeriesConfig {
  key: string
  label: string
  values: (number | null)[]
  color: string
}

export interface TimeSeriesChartProps {
  timestamps: number[]
  series: SeriesConfig[]
  title: string
  height?: number
  hoveredIndex: number | null
  onHoverChange: (index: number | null) => void
}

const formatGameDate = (timestamp: number): string => {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}.${month}`
}

const formatValue = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—'
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}${Math.round(value).toLocaleString()}`
}

const createChartOptions = (
  title: string,
  series: SeriesConfig[],
  height: number,
  onHoverChange: (index: number | null) => void,
): uPlot.Options => ({
  title,
  width: 0,
  height,
  background: 'transparent',
  cursor: {
    drag: { x: false, y: false },
  },
  scales: {
    x: { time: true },
  },
  hooks: {
    setCursor: [
      (u) => {
        const idx = u.cursor.idx
        onHoverChange(idx === undefined ? null : idx)
      },
    ],
  },
  axes: [
    {
      stroke: vars.color.textMuted,
      grid: {
        stroke: 'rgba(70, 130, 180, 0.15)',
        width: 1,
      },
      ticks: {
        stroke: vars.color.border,
        width: 1,
      },
      font: `12px ${vars.font.body}`,
      values: (_self, ticks) => ticks.map((t) => formatGameDate(t * 1000)),
    },
    {
      stroke: vars.color.textMuted,
      grid: {
        stroke: 'rgba(70, 130, 180, 0.15)',
        width: 1,
      },
      ticks: {
        stroke: vars.color.border,
        width: 1,
      },
      font: `12px ${vars.font.body}`,
    },
  ],
  series: [
    {},
    ...series.map((s) => ({
      label: s.label,
      stroke: s.color,
      width: 2,
      spanGaps: true,
    })),
  ],
})

export const TimeSeriesChart = ({
  timestamps,
  series,
  title,
  height = 350,
  hoveredIndex,
  onHoverChange,
}: TimeSeriesChartProps): React.ReactElement => {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<uPlot | null>(null)
  const onHoverChangeRef = useRef(onHoverChange)
  onHoverChangeRef.current = onHoverChange

  const stableOnHoverChange = useCallback((index: number | null) => {
    onHoverChangeRef.current(index)
  }, [])

  useEffect(() => {
    if (!containerRef.current || timestamps.length === 0) return

    const opts = createChartOptions(title, series, height, stableOnHoverChange)
    opts.width = containerRef.current.offsetWidth

    const data: uPlot.AlignedData = [
      timestamps.map((t) => t / 1000),
      ...series.map((s) => s.values.map((v) => v ?? null)),
    ]

    chartRef.current = new uPlot(opts, data, containerRef.current)

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.setSize({
          width: containerRef.current.offsetWidth,
          height,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chartRef.current?.destroy()
    }
  }, [timestamps, series, title, height, stableOnHoverChange])

  useEffect(() => {
    if (chartRef.current && timestamps.length > 0) {
      const data: uPlot.AlignedData = [
        timestamps.map((t) => t / 1000),
        ...series.map((s) => s.values.map((v) => v ?? null)),
      ]
      chartRef.current.setData(data)
    }
  }, [timestamps, series])

  useEffect(() => {
    if (chartRef.current && hoveredIndex !== null) {
      chartRef.current.setCursor({ idx: hoveredIndex, left: -1, top: -1 })
    }
  }, [hoveredIndex])

  const handleMouseLeave = () => {
    onHoverChange(null)
  }

  const displayIndex = hoveredIndex ?? timestamps.length - 1
  const isHovering = hoveredIndex !== null

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <div
        className={styles.chartWrapper}
        ref={containerRef}
        onMouseLeave={handleMouseLeave}
      />
      <div className={styles.legend}>
        {series.map((s) => {
          const value = s.values[displayIndex]
          return (
            <div key={s.key} className={styles.legendItem}>
              <div
                className={styles.legendColor}
                style={{ backgroundColor: s.color }}
              />
              <span className={styles.legendLabel}>{s.label}</span>
              <span className={styles.legendValue}>
                {isHovering || timestamps.length > 0 ? formatValue(value) : '—'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**Step 2: Verify build passes**

Run: `npm run ui:build`
Expected: Build succeeds (may have type errors in BudgetDashboard - that's OK for now)

**Step 3: Commit**

```bash
git add ui/src/components/TimeSeriesChart.tsx
git commit -m "feat(ui): add hover state and interactive legend to TimeSeriesChart"
```

---

## Task 4: Update BudgetDashboard CSS

**Files:**

- Modify: `ui/src/components/BudgetDashboard.css.ts`

**Step 1: Replace grid layout with vertical stack**

Replace `chartsGrid` in `ui/src/components/BudgetDashboard.css.ts`:

```typescript
export const chartsGrid = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.lg,
})
```

**Step 2: Verify build passes**

Run: `npm run ui:build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add ui/src/components/BudgetDashboard.css.ts
git commit -m "feat(ui): change chart layout from grid to vertical stack"
```

---

## Task 5: Update BudgetDashboard Component

**Files:**

- Modify: `ui/src/components/BudgetDashboard.tsx`

**Step 1: Replace with new category-based implementation**

Replace the entire `ui/src/components/BudgetDashboard.tsx` file:

```typescript
import { useMemo, useState } from 'react'
import { vars } from '../styles/theme.css'
import { useRealtimeBudget } from '../hooks/useRealtimeBudget'
import { TimeSeriesChart, SeriesConfig } from './TimeSeriesChart'
import * as styles from './BudgetDashboard.css'

export interface BudgetDashboardProps {
  filename: string
}

interface ResourceCategory {
  title: string
  resources: {
    key: string
    label: string
    color: string
  }[]
}

const RESOURCE_CATEGORIES: ResourceCategory[] = [
  {
    title: 'Basic Resources',
    resources: [
      { key: 'energy', label: 'Energy', color: vars.color.energy },
      { key: 'minerals', label: 'Minerals', color: vars.color.minerals },
      { key: 'food', label: 'Food', color: vars.color.food },
      { key: 'trade', label: 'Trade', color: vars.color.trade },
    ],
  },
  {
    title: 'Advanced Resources',
    resources: [
      { key: 'alloys', label: 'Alloys', color: vars.color.alloys },
      { key: 'consumerGoods', label: 'Consumer Goods', color: vars.color.consumerGoods },
    ],
  },
  {
    title: 'Basic Strategic Resources',
    resources: [
      { key: 'rareCrystals', label: 'Rare Crystals', color: vars.color.rareCrystals },
      { key: 'exoticGases', label: 'Exotic Gases', color: vars.color.exoticGases },
      { key: 'volatileMotes', label: 'Volatile Motes', color: vars.color.volatileMotes },
    ],
  },
  {
    title: 'Advanced Strategic Resources',
    resources: [
      { key: 'srDarkMatter', label: 'Dark Matter', color: vars.color.srDarkMatter },
      { key: 'srLivingMetal', label: 'Living Metal', color: vars.color.srLivingMetal },
      { key: 'srZro', label: 'Zro', color: vars.color.srZro },
    ],
  },
  {
    title: 'Abstract Resources',
    resources: [
      { key: 'unity', label: 'Unity', color: vars.color.unity },
      { key: 'influence', label: 'Influence', color: vars.color.influence },
    ],
  },
  {
    title: 'Research',
    resources: [
      { key: 'physicsResearch', label: 'Physics', color: vars.color.physicsResearch },
      { key: 'societyResearch', label: 'Society', color: vars.color.societyResearch },
      { key: 'engineeringResearch', label: 'Engineering', color: vars.color.engineeringResearch },
    ],
  },
]

type ResourceKey = string

const hasAnyData = (
  values: (number | null)[],
): boolean => values.some((v) => v !== null && v !== 0)

export const BudgetDashboard = ({
  filename,
}: BudgetDashboardProps): React.ReactElement => {
  const { gamestates, loading, error, saveName } = useRealtimeBudget(filename)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const chartData = useMemo(() => {
    if (gamestates.length === 0) return null

    const sortedGamestates = [...gamestates].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    const timestamps = sortedGamestates.map((g) => new Date(g.date).getTime())

    const getResourceValues = (key: ResourceKey): (number | null)[] =>
      sortedGamestates.map((g) => {
        const totals = g.budget?.totals?.balance
        if (!totals) return null
        return (totals as Record<string, number | null>)[key] ?? null
      })

    const categories = RESOURCE_CATEGORIES.map((category) => {
      const seriesWithData: SeriesConfig[] = []

      for (const resource of category.resources) {
        const values = getResourceValues(resource.key)
        if (hasAnyData(values)) {
          seriesWithData.push({
            key: resource.key,
            label: resource.label,
            color: resource.color,
            values,
          })
        }
      }

      return {
        title: category.title,
        series: seriesWithData,
      }
    }).filter((category) => category.series.length > 0)

    return { timestamps, categories }
  }, [gamestates])

  if (loading) {
    return <div className={styles.loadingContainer}>Loading budget data...</div>
  }

  if (error) {
    return <div className={styles.errorContainer}>Error: {error.message}</div>
  }

  if (!chartData || chartData.categories.length === 0) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.dashboardHeader}>
          <h2 className={styles.dashboardTitle}>Empire Budget</h2>
          {saveName && <span className={styles.saveName}>{saveName}</span>}
        </div>
        <div className={styles.noDataContainer}>No budget data available for this save</div>
      </div>
    )
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardHeader}>
        <h2 className={styles.dashboardTitle}>Empire Budget</h2>
        {saveName && <span className={styles.saveName}>{saveName}</span>}
      </div>

      <div className={styles.chartsGrid}>
        {chartData.categories.map((category) => (
          <TimeSeriesChart
            key={category.title}
            title={category.title}
            timestamps={chartData.timestamps}
            series={category.series}
            hoveredIndex={hoveredIndex}
            onHoverChange={setHoveredIndex}
          />
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Verify build passes**

Run: `npm run ui:build`
Expected: Build succeeds with no errors

**Step 3: Run TypeScript checks**

Run: `npm run lint:typescript`
Expected: No lint errors

**Step 4: Commit**

```bash
git add ui/src/components/BudgetDashboard.tsx
git commit -m "feat(ui): implement category-based resource grouping with shared hover"
```

---

## Task 6: Update Test Fixture with Strategic/Research Data

**Files:**

- Modify: `ui/playwright/fixtures/sql/single-save-with-budget.sql`

**Step 1: Update fixture with all resource types**

Replace the entire `ui/playwright/fixtures/sql/single-save-with-budget.sql` file:

```sql
INSERT INTO save (filename, name)
VALUES ('test-empire.sav', 'Test Empire');

INSERT INTO gamestate (save_id, date, data)
VALUES
  (
    (SELECT save_id FROM save WHERE filename = 'test-empire.sav'),
    '2300-01-01',
    '{}'::jsonb
  ),
  (
    (SELECT save_id FROM save WHERE filename = 'test-empire.sav'),
    '2300-06-01',
    '{}'::jsonb
  ),
  (
    (SELECT save_id FROM save WHERE filename = 'test-empire.sav'),
    '2301-01-01',
    '{}'::jsonb
  );

-- Budget for first gamestate (early game - no strategic resources yet)
INSERT INTO budget_entry (
  energy, minerals, food, trade,
  alloys, consumer_goods,
  unity, influence,
  physics_research, society_research, engineering_research
)
VALUES (100.0, 150.0, 50.0, 10.0, 20.0, 25.0, 5.0, 2.0, 30.0, 25.0, 28.0);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  (
    (SELECT gamestate_id FROM gamestate
     WHERE save_id = (SELECT save_id FROM save WHERE filename = 'test-empire.sav')
     AND date = '2300-01-01'),
    'balance',
    'total',
    (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
  );

-- Budget for second gamestate (mid game - some strategic resources)
INSERT INTO budget_entry (
  energy, minerals, food, trade,
  alloys, consumer_goods,
  rare_crystals, exotic_gases, volatile_motes,
  unity, influence,
  physics_research, society_research, engineering_research
)
VALUES (200.0, 300.0, 100.0, 20.0, 40.0, 50.0, 5.0, 3.0, 4.0, 10.0, 4.0, 60.0, 50.0, 55.0);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  (
    (SELECT gamestate_id FROM gamestate
     WHERE save_id = (SELECT save_id FROM save WHERE filename = 'test-empire.sav')
     AND date = '2300-06-01'),
    'balance',
    'total',
    (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
  );

-- Budget for third gamestate (late game - all resources including advanced strategic)
INSERT INTO budget_entry (
  energy, minerals, food, trade,
  alloys, consumer_goods,
  rare_crystals, exotic_gases, volatile_motes,
  sr_dark_matter, sr_living_metal, sr_zro,
  unity, influence,
  physics_research, society_research, engineering_research
)
VALUES (350.0, 500.0, 175.0, 35.0, 70.0, 85.0, 10.0, 8.0, 9.0, 2.0, 1.0, 3.0, 18.0, 7.0, 120.0, 100.0, 110.0);

INSERT INTO budget_category (gamestate_id, category_type, category_name, budget_entry_id)
VALUES
  (
    (SELECT gamestate_id FROM gamestate
     WHERE save_id = (SELECT save_id FROM save WHERE filename = 'test-empire.sav')
     AND date = '2301-01-01'),
    'balance',
    'total',
    (SELECT budget_entry_id FROM budget_entry ORDER BY budget_entry_id DESC LIMIT 1)
  );
```

**Step 2: Commit**

```bash
git add ui/playwright/fixtures/sql/single-save-with-budget.sql
git commit -m "test(ui): add strategic and research resources to test fixture"
```

---

## Task 7: Update E2E Tests

**Files:**

- Modify: `ui/playwright/tests/save-selection.spec.ts`

**Step 1: Update test assertions for new chart structure**

Replace the test file `ui/playwright/tests/save-selection.spec.ts`:

```typescript
import { test, expect } from '../fixtures/test-base'

test.describe('Save Selection', () => {
  test('shows welcome state on initial load', async ({
    page,
    resetDatabase,
  }) => {
    await resetDatabase()
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'Stellaris Stats' }),
    ).toBeVisible()
    await expect(page.getByText('Select a save from the sidebar')).toBeVisible()
  })

  test('displays list of saves in sidebar', async ({ page, loadFixture }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await expect(page.getByRole('heading', { name: 'Saves' })).toBeVisible()
    await expect(
      sidebar.getByRole('heading', { name: 'Empire Alpha' }),
    ).toBeVisible()
    await expect(
      sidebar.getByRole('heading', { name: 'Empire Beta' }),
    ).toBeVisible()
    await expect(
      sidebar.getByRole('heading', { name: 'Empire Gamma' }),
    ).toBeVisible()
  })

  test('selecting a save shows the dashboard', async ({
    page,
    loadFixture,
  }) => {
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await sidebar.getByRole('heading', { name: 'Empire Alpha' }).click()

    await expect(
      page.getByRole('heading', { name: 'Empire Budget' }),
    ).toBeVisible()
    await expect(page.getByRole('main').getByText('Empire Alpha')).toBeVisible()
  })

  test('dashboard displays resource category sections', async ({
    page,
    loadFixture,
  }) => {
    await loadFixture('single-save-with-budget.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await sidebar.getByRole('heading', { name: 'Test Empire' }).click()

    // Core categories that should always be present with test data
    await expect(
      page.getByRole('heading', { name: 'Basic Resources' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Advanced Resources' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Abstract Resources' }),
    ).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Research' })).toBeVisible()

    // Strategic categories (present because fixture has this data)
    await expect(
      page.getByRole('heading', { name: 'Basic Strategic Resources' }),
    ).toBeVisible()
    await expect(
      page.getByRole('heading', { name: 'Advanced Strategic Resources' }),
    ).toBeVisible()
  })

  test('chart legends show resource names and values', async ({
    page,
    loadFixture,
  }) => {
    await loadFixture('single-save-with-budget.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await sidebar.getByRole('heading', { name: 'Test Empire' }).click()

    // Basic resources legend shows names
    await expect(page.getByText('Energy').first()).toBeVisible()
    await expect(page.getByText('Minerals').first()).toBeVisible()
    await expect(page.getByText('Food').first()).toBeVisible()
    await expect(page.getByText('Trade').first()).toBeVisible()

    // Legend shows values (latest values from fixture)
    await expect(page.getByText('+350').first()).toBeVisible() // Energy
  })

  test('empty categories are not rendered', async ({ page, loadFixture }) => {
    // Use multiple-saves fixture which has no budget data
    await loadFixture('multiple-saves.sql')
    await page.goto('/')

    const sidebar = page.locator('aside')
    await sidebar.getByRole('heading', { name: 'Empire Alpha' }).click()

    // Should show no data message instead of chart sections
    await expect(page.getByText('No budget data available')).toBeVisible()

    // Chart sections should not be visible
    await expect(
      page.getByRole('heading', { name: 'Basic Resources' }),
    ).not.toBeVisible()
  })
})
```

**Step 2: Run tests to verify**

Run: `npm run test:ci:e2e`
Expected: All tests pass

**Step 3: Commit**

```bash
git add ui/playwright/tests/save-selection.spec.ts
git commit -m "test(ui): update E2E tests for new resource category structure"
```

---

## Task 8: Final Verification

**Step 1: Run full UI build**

Run: `npm run ui:build`
Expected: Build succeeds

**Step 2: Run TypeScript lint**

Run: `npm run lint:typescript`
Expected: No errors

**Step 3: Run E2E tests**

Run: `npm run test:ci:e2e`
Expected: All tests pass

**Step 4: Manual verification (optional)**

Run: `npm run ui:dev`

- Open http://localhost:5173
- Select a save with budget data
- Verify 6 category charts render vertically
- Verify legend shows values
- Verify hovering updates values across all charts

---

## Summary

| Task | Description            | Files                         |
| ---- | ---------------------- | ----------------------------- |
| 1    | Add theme colors       | `theme.css.ts`                |
| 2    | Update chart CSS       | `TimeSeriesChart.css.ts`      |
| 3    | Update TimeSeriesChart | `TimeSeriesChart.tsx`         |
| 4    | Update dashboard CSS   | `BudgetDashboard.css.ts`      |
| 5    | Update BudgetDashboard | `BudgetDashboard.tsx`         |
| 6    | Update test fixture    | `single-save-with-budget.sql` |
| 7    | Update E2E tests       | `save-selection.spec.ts`      |
| 8    | Final verification     | —                             |
