# Budget Dashboard Tab-Based Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Empire Budget view from 6 stacked charts to a single viewport-filling chart with category tabs and clickable legend items.

**Architecture:** Add tab-based navigation to BudgetDashboard that switches between resource categories. Single TimeSeriesChart component fills remaining viewport height. Legend items become clickable to toggle line visibility.

**Tech Stack:** React, vanilla-extract CSS, uPlot

---

## Task 1: Add Tab and Legend Styles to CSS

**Files:**

- Modify: `ui/src/components/BudgetDashboard.css.ts`
- Modify: `ui/src/components/TimeSeriesChart.css.ts`

**Step 1: Add tab styles to BudgetDashboard.css.ts**

Add after `saveName` style:

```typescript
export const categoryTabs = style({
  display: 'flex',
  gap: vars.space.sm,
  flexWrap: 'wrap',
})

export const tab = style({
  'padding': `${vars.space.sm} ${vars.space.md}`,
  'background': vars.color.surface,
  'border': `1px solid ${vars.color.border}`,
  'borderRadius': vars.radius.sm,
  'cursor': 'pointer',
  'fontFamily': vars.font.body,
  'fontSize': '0.9rem',
  'color': vars.color.textMuted,
  'transition': 'all 0.2s',
  ':hover': {
    background: vars.color.surfaceHover,
    color: vars.color.text,
  },
})

export const tabActive = style({
  background: vars.color.surfaceHover,
  borderColor: vars.color.primary,
  color: vars.color.text,
})

export const chartSection = style({
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
})
```

**Step 2: Update dashboardContainer and remove chartsGrid**

Replace the existing `dashboardContainer` and `chartsGrid` styles:

```typescript
export const dashboardContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.lg,
  height: '100%',
  maxWidth: '1400px',
  width: '100%',
  margin: '0 auto',
})
```

Remove `chartsGrid` style entirely.

**Step 3: Add clickable legend styles to TimeSeriesChart.css.ts**

Update `legendItem` and add new styles:

```typescript
export const legendItem = style({
  'display': 'flex',
  'alignItems': 'center',
  'gap': vars.space.sm,
  'fontFamily': vars.font.body,
  'fontSize': '0.85rem',
  'color': vars.color.text,
  'maxWidth': '280px',
  'cursor': 'pointer',
  'padding': `${vars.space.xs} ${vars.space.sm}`,
  'borderRadius': vars.radius.sm,
  'transition': 'background 0.2s',
  ':hover': {
    background: vars.color.surfaceHover,
  },
})

export const legendItemHidden = style({
  opacity: 0.4,
})
```

**Step 4: Update chartContainer to fill height**

Update `chartContainer`:

```typescript
export const chartContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.sm,
  padding: vars.space.md,
  backgroundColor: vars.color.surface,
  border: `1px solid ${vars.color.border}`,
  borderRadius: vars.radius.sm,
  boxShadow: vars.shadow.panel,
  flex: 1,
  minHeight: 0,
})
```

**Step 5: Update chartWrapper to fill remaining space**

Update `chartWrapper`:

```typescript
export const chartWrapper = style({
  position: 'relative',
  width: '100%',
  flex: 1,
  minHeight: '300px',
})
```

**Step 6: Update legend to horizontal layout**

Update `legend`:

```typescript
export const legend = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.sm,
  padding: vars.space.sm,
})
```

**Step 7: Build to verify CSS compiles**

Run: `npm run ui:build`
Expected: Build succeeds with no errors

**Step 8: Commit**

```bash
git add ui/src/components/BudgetDashboard.css.ts ui/src/components/TimeSeriesChart.css.ts
git commit -m "style: add tab and clickable legend styles for budget dashboard redesign"
```

---

## Task 2: Update App.css.ts for Full-Height Layout

**Files:**

- Modify: `ui/src/App.css.ts`

**Step 1: Update mainContent to use height instead of overflow**

Update `mainContent`:

```typescript
export const mainContent = style({
  flex: 1,
  height: '100vh',
  overflow: 'hidden',
})
```

**Step 2: Update appContainer to use fixed height**

Update `appContainer`:

```typescript
export const appContainer = style({
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
  backgroundColor: vars.color.background,
})
```

**Step 3: Build to verify**

Run: `npm run ui:build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add ui/src/App.css.ts
git commit -m "style: update app layout for full-height dashboard"
```

---

## Task 3: Add Clickable Legend to TimeSeriesChart

**Files:**

- Modify: `ui/src/components/TimeSeriesChart.tsx`

**Step 1: Add new props to TimeSeriesChartProps**

Update the interface:

```typescript
export interface TimeSeriesChartProps {
  timestamps: number[]
  series: SeriesConfig[]
  title: string
  height?: number
  hoveredIndex: number | null
  onHoverChange: (index: number | null) => void
  hiddenKeys?: Set<string>
  onToggleResource?: (key: string) => void
}
```

**Step 2: Update component to accept new props**

Update the destructuring:

```typescript
export const TimeSeriesChart = ({
  timestamps,
  series,
  title,
  height,
  hoveredIndex,
  onHoverChange,
  hiddenKeys = new Set(),
  onToggleResource,
}: TimeSeriesChartProps): React.ReactElement => {
```

**Step 3: Add containerRef for measuring height**

Add ref and state for dynamic height:

```typescript
const outerContainerRef = useRef<HTMLDivElement>(null)
const [chartHeight, setChartHeight] = useState(height ?? 350)
```

**Step 4: Add ResizeObserver to measure available height**

Add after the existing useEffect blocks:

```typescript
useEffect(() => {
  if (!outerContainerRef.current || height !== undefined) return

  const observer = new ResizeObserver((entries) => {
    const entry = entries[0]
    if (entry) {
      // Subtract space for title (~40px) and legend (~80px)
      const availableHeight = entry.contentRect.height - 120
      setChartHeight(Math.max(300, availableHeight))
    }
  })

  observer.observe(outerContainerRef.current)
  return () => observer.disconnect()
}, [height])
```

**Step 5: Update chart creation to use dynamic height**

In the chart creation useEffect, replace `height` with `chartHeight`:

```typescript
const opts = createChartOptions(title, series, chartHeight, stableOnHoverChange)
```

And in the resize handler:

```typescript
const handleResize = () => {
  if (containerRef.current && chartRef.current) {
    chartRef.current.setSize({
      width: containerRef.current.offsetWidth,
      height: chartHeight,
    })
  }
}
```

Update the dependency array to include `chartHeight`:

```typescript
}, [timestamps, series, title, chartHeight, stableOnHoverChange])
```

**Step 6: Make legend items clickable**

Update the legend rendering:

```typescript
<div className={styles.legend}>
  {series.map((s) => {
    const value = s.values[displayIndex]
    const isHidden = hiddenKeys.has(s.key)
    return (
      <div
        key={s.key}
        className={`${styles.legendItem} ${isHidden ? styles.legendItemHidden : ''}`}
        onClick={() => onToggleResource?.(s.key)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onToggleResource?.(s.key)
          }
        }}
        role="button"
        tabIndex={0}
        aria-pressed={!isHidden}
      >
        <div
          className={styles.legendColor}
          style={{ backgroundColor: isHidden ? '#666' : s.color }}
        />
        <span className={styles.legendLabel}>{s.label}</span>
        <span className={styles.legendValue}>
          {isHovering || timestamps.length > 0 ? formatValue(value) : '—'}
        </span>
      </div>
    )
  })}
</div>
```

**Step 7: Add ref to outer container**

Update the return JSX:

```typescript
return (
  <div className={styles.chartContainer} ref={outerContainerRef}>
```

**Step 8: Build to verify**

Run: `npm run ui:build`
Expected: Build succeeds

**Step 9: Commit**

```bash
git add ui/src/components/TimeSeriesChart.tsx
git commit -m "feat: add clickable legend and dynamic height to TimeSeriesChart"
```

---

## Task 4: Add Tab Navigation to BudgetDashboard

**Files:**

- Modify: `ui/src/components/BudgetDashboard.tsx`

**Step 1: Add selectedCategory and hiddenResources state**

Add after the existing useState calls:

```typescript
const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
const [hiddenResources, setHiddenResources] = useState<Set<string>>(new Set())
```

**Step 2: Add effect to set default category when data loads**

Add after chartData useMemo:

```typescript
useEffect(() => {
  if (
    chartData
    && chartData.categories.length > 0
    && selectedCategory === null
  ) {
    setSelectedCategory(chartData.categories[0].title)
  }
}, [chartData, selectedCategory])
```

**Step 3: Add effect to reset hiddenResources when category changes**

Add after the previous effect:

```typescript
useEffect(() => {
  setHiddenResources(new Set())
}, [selectedCategory])
```

**Step 4: Add handleToggleResource callback**

Add after the effects:

```typescript
const handleToggleResource = (key: string) => {
  setHiddenResources((prev) => {
    const next = new Set(prev)
    if (next.has(key)) {
      next.delete(key)
    } else {
      next.add(key)
    }
    return next
  })
}
```

**Step 5: Get selected category data**

Add after handleToggleResource:

```typescript
const selectedCategoryData = chartData?.categories.find(
  (c) => c.title === selectedCategory,
)

const visibleSeries =
  selectedCategoryData?.series.filter((s) => !hiddenResources.has(s.key)) ?? []
```

**Step 6: Update the main return JSX**

Replace the entire return statement for the success case:

```typescript
return (
  <div className={styles.dashboardContainer}>
    <div className={styles.dashboardHeader}>
      <h2 className={styles.dashboardTitle}>Empire Budget</h2>
      {saveName && <span className={styles.saveName}>{saveName}</span>}
    </div>

    <nav className={styles.categoryTabs}>
      {chartData.categories.map((category) => (
        <button
          key={category.title}
          className={`${styles.tab} ${selectedCategory === category.title ? styles.tabActive : ''}`}
          onClick={() => setSelectedCategory(category.title)}
          type="button"
        >
          {category.title}
        </button>
      ))}
    </nav>

    {selectedCategoryData && (
      <div className={styles.chartSection}>
        <TimeSeriesChart
          title={selectedCategoryData.title}
          timestamps={chartData.timestamps}
          series={selectedCategoryData.series}
          hoveredIndex={hoveredIndex}
          onHoverChange={setHoveredIndex}
          hiddenKeys={hiddenResources}
          onToggleResource={handleToggleResource}
        />
      </div>
    )}
  </div>
)
```

**Step 7: Remove chartsGrid import usage**

The `chartsGrid` style is no longer used - it was removed in Task 1.

**Step 8: Build to verify**

Run: `npm run ui:build`
Expected: Build succeeds

**Step 9: Commit**

```bash
git add ui/src/components/BudgetDashboard.tsx
git commit -m "feat: add tab navigation and resource visibility toggle to BudgetDashboard"
```

---

## Task 5: Update E2E Tests

**Files:**

- Modify: `ui/playwright/tests/save-selection.spec.ts`

**Step 1: Update 'dashboard displays resource category sections' test**

Replace the test to check for tabs instead of headings:

```typescript
test('dashboard displays category tabs', async ({ page, loadFixture }) => {
  await loadFixture('single-save-with-budget.sql')
  await page.goto('/')

  const sidebar = page.locator('aside')
  await sidebar.getByRole('heading', { name: 'Test Empire' }).click()

  // Should show category tabs
  await expect(
    page.getByRole('button', { name: 'Basic Resources' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Advanced Resources' }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Abstract Resources' }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Research' })).toBeVisible()

  // First tab should be active by default, showing its chart
  await expect(
    page.getByRole('heading', { name: 'Basic Resources' }),
  ).toBeVisible()
})
```

**Step 2: Update 'empty categories are not rendered' test**

Update the assertions:

```typescript
test('empty categories are not rendered', async ({ page, loadFixture }) => {
  // Use multiple-saves fixture which has no budget data
  await loadFixture('multiple-saves.sql')
  await page.goto('/')

  const sidebar = page.locator('aside')
  await sidebar.getByRole('heading', { name: 'Empire Alpha' }).click()

  // Should show no data message instead of tabs
  await expect(page.getByText('No budget data available')).toBeVisible()

  // Category tabs should not be visible
  await expect(
    page.getByRole('button', { name: 'Basic Resources' }),
  ).not.toBeVisible()
})
```

**Step 3: Update 'charts do not show uPlot built-in legend' test**

Update to work with single chart:

```typescript
test('charts do not show uPlot built-in legend', async ({
  page,
  loadFixture,
}) => {
  await loadFixture('single-save-with-budget.sql')
  await page.goto('/')

  const sidebar = page.locator('aside')
  await sidebar.getByRole('heading', { name: 'Test Empire' }).click()

  // Wait for chart to render
  await expect(
    page.getByRole('heading', { name: 'Basic Resources' }),
  ).toBeVisible()

  // uPlot's built-in legend uses .u-legend class - should not be visible
  await expect(page.locator('.u-legend')).toHaveCount(0)
})
```

**Step 4: Update 'hovering on chart updates legend values' test**

Update to work with single chart:

```typescript
test('hovering on chart updates legend values', async ({
  page,
  loadFixture,
}) => {
  await loadFixture('single-save-with-budget.sql')
  await page.goto('/')

  const sidebar = page.locator('aside')
  await sidebar.getByRole('heading', { name: 'Test Empire' }).click()

  // Wait for chart to render
  await expect(
    page.getByRole('heading', { name: 'Basic Resources' }),
  ).toBeVisible()

  // Get initial Energy value from legend (latest value is +350)
  const energyValue = page.getByText('+350').first()
  await expect(energyValue).toBeVisible()

  // Hover on the chart canvas at an earlier position (left side)
  const canvas = page.locator('canvas').first()
  const box = await canvas.boundingBox()
  if (box) {
    // Hover at 20% from left (earlier in timeline, should show different values)
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5)

    // Wait a bit for the hover state to update
    await page.waitForTimeout(100)

    // The value should change from +350 (this verifies hover updates the legend)
    await expect(page.getByText('+350')).not.toBeVisible()
  }
})
```

**Step 5: Add new test for tab switching**

Add after the existing tests:

```typescript
test('clicking category tab switches displayed chart', async ({
  page,
  loadFixture,
}) => {
  await loadFixture('single-save-with-budget.sql')
  await page.goto('/')

  const sidebar = page.locator('aside')
  await sidebar.getByRole('heading', { name: 'Test Empire' }).click()

  // Initially shows Basic Resources
  await expect(
    page.getByRole('heading', { name: 'Basic Resources' }),
  ).toBeVisible()
  await expect(page.getByText('Energy')).toBeVisible()

  // Click Research tab
  await page.getByRole('button', { name: 'Research' }).click()

  // Should now show Research chart
  await expect(page.getByRole('heading', { name: 'Research' })).toBeVisible()
  await expect(page.getByText('Physics')).toBeVisible()

  // Basic Resources chart title should no longer be visible
  await expect(
    page.getByRole('heading', { name: 'Basic Resources' }),
  ).not.toBeVisible()
})
```

**Step 6: Add new test for legend toggle**

Add after the previous test:

```typescript
test('clicking legend item toggles line visibility', async ({
  page,
  loadFixture,
}) => {
  await loadFixture('single-save-with-budget.sql')
  await page.goto('/')

  const sidebar = page.locator('aside')
  await sidebar.getByRole('heading', { name: 'Test Empire' }).click()

  // Wait for chart to render
  await expect(
    page.getByRole('heading', { name: 'Basic Resources' }),
  ).toBeVisible()

  // Find the Energy legend item and click it
  const energyLegend = page.getByRole('button', { name: /Energy/ })
  await expect(energyLegend).toBeVisible()

  // Click to hide
  await energyLegend.click()

  // Legend item should have reduced opacity (hidden state)
  await expect(energyLegend).toHaveCSS('opacity', '0.4')

  // Click again to show
  await energyLegend.click()

  // Legend item should be fully visible again
  await expect(energyLegend).toHaveCSS('opacity', '1')
})
```

**Step 7: Run E2E tests**

Run: `npm run test:ci:e2e`
Expected: All tests pass

**Step 8: Commit**

```bash
git add ui/playwright/tests/save-selection.spec.ts
git commit -m "test: update E2E tests for tab-based budget dashboard"
```

---

## Task 6: Manual Visual Verification

**Step 1: Start dev server**

Run: `npm run ui:dev`

**Step 2: Open browser and verify**

Open: http://localhost:5173

Check:

- [ ] Category tabs appear below "Empire Budget" heading
- [ ] Clicking a tab switches the displayed chart
- [ ] Chart fills available viewport height (no scrollbar on 16" MacBook)
- [ ] Chart is max 1400px wide and centered on larger screens
- [ ] Legend items are clickable
- [ ] Clicking legend item dims it and hides the line
- [ ] Clicking again restores visibility
- [ ] Hover still shows crosshair and updates values

**Step 3: Run full quality checks**

Run: `npm run ui:build && npm run test:ci:e2e`
Expected: All pass

**Step 4: Final commit if any fixes needed**

If fixes were needed, commit them with appropriate message.

---

## Summary

| Task | Description                             | Files                                          |
| ---- | --------------------------------------- | ---------------------------------------------- |
| 1    | Add tab and legend CSS styles           | BudgetDashboard.css.ts, TimeSeriesChart.css.ts |
| 2    | Update App layout for full height       | App.css.ts                                     |
| 3    | Add clickable legend to TimeSeriesChart | TimeSeriesChart.tsx                            |
| 4    | Add tab navigation to BudgetDashboard   | BudgetDashboard.tsx                            |
| 5    | Update E2E tests                        | save-selection.spec.ts                         |
| 6    | Manual visual verification              | -                                              |
