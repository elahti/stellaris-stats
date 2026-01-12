# Budget Dashboard Tab-Based Redesign

## Overview

Transform the Empire Budget view from a vertically-scrolling list of 6 charts to a single, viewport-filling chart with tab-based category switching.

**Wireframe:** `docs/html-mockups/2026-01-12-budget-dashboard-redesign.html`

### Current State

- 6 charts stacked vertically, each ~350px tall
- Requires scrolling to see all categories
- All data visible at once but cramped

### New Layout

- Category tabs below "Empire Budget" heading
- Single chart fills remaining viewport height
- No scrolling needed on 16" MacBook Pro or larger
- Max-width 1400px, centered on WQHD/4K displays

## Sizing

### Formula

```
Chart width:  min(100% of content area, 1400px)
Chart height: calc(100vh - header - tabs - legend - padding)
              ≈ 100vh - 60px - 50px - 80px - 48px = ~100vh - 238px
```

### Chart Heights by Display

| Display         | Viewport Height | Chart Height |
| --------------- | --------------- | ------------ |
| 14" MacBook Pro | ~900px          | ~660px       |
| 16" MacBook Pro | ~1117px         | ~880px       |
| 1080p (Full HD) | 1080px          | ~840px       |
| 1440p (WQHD)    | 1440px          | ~1200px      |

### Comparison with Current Design

- Current: 350px fixed height per chart
- New on 16" MacBook: 880px (2.5× larger)
- New on WQHD: 1200px (3.4× larger)

## Interaction Details

### Category Tabs

- 6 buttons below the header: Basic Resources, Advanced Resources, Basic Strategic, Advanced Strategic, Abstract Resources, Research
- Active tab highlighted with accent border/background
- Clicking a tab switches the chart to show that category's resources
- Default selection: Basic Resources (first tab)
- Tab state persisted in component state (not URL)

### Clickable Legend

- Legend items displayed horizontally below the chart
- Each item shows: color box, resource name, current value
- Clicking an item toggles that line's visibility
- Hidden items: dimmed appearance (reduced opacity), gray color box
- All resources visible by default when switching categories
- Visibility state resets when changing categories

### Hover Behavior (Unchanged)

- Vertical crosshair follows mouse on chart
- Legend values update to show values at hovered timestamp
- When not hovering: shows latest datapoint values

### Keyboard Accessibility

- Tabs focusable and activatable with Enter/Space
- Legend items focusable and toggleable with Enter/Space

## Component Changes

### BudgetDashboard.tsx

- Add `selectedCategory` state (default: first category with data)
- Add `hiddenResources` state: `Set<string>` of hidden resource keys
- Reset `hiddenResources` when `selectedCategory` changes
- Render category tabs from `RESOURCE_CATEGORIES`
- Pass only the selected category's series to `TimeSeriesChart`
- Filter out hidden resources from series before passing

### BudgetDashboard.css.ts

- Add `categoryTabs` style: flex row, gap, flex-wrap
- Add `tab` style: padding, background, border, border-radius
- Add `tabActive` style: accent border, different background
- Update `chartsGrid` → remove (no longer a grid)
- Add `chartSection` style: flex container that fills remaining height

### TimeSeriesChart.tsx

- Add `onToggleResource` prop: `(key: string) => void`
- Make legend items clickable (call `onToggleResource` on click)
- Add `hiddenKeys` prop: `Set<string>` for styling hidden items
- Apply dimmed styling to hidden legend items

### TimeSeriesChart.css.ts

- Add `legendItemClickable` style: cursor pointer, hover state
- Add `legendItemHidden` style: opacity 0.4, gray color box

## CSS Sizing Implementation

### Content Wrapper (max-width constraint)

```css
.contentWrapper {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
}
```

### Chart Section (fills remaining space)

```css
.chartSection {
  flex: 1;
  min-height: 0; /* Critical: allows flex child to shrink */
  display: flex;
  flex-direction: column;
}
```

### Chart Wrapper (actual chart container)

```css
.chartWrapper {
  flex: 1;
  min-height: 300px; /* Minimum usable chart height */
}
```

### Dashboard Container (full viewport)

```css
.dashboardContainer {
  height: 100%; /* Fill parent (main content area) */
  display: flex;
  flex-direction: column;
}
```

### Key CSS Techniques

- `flex: 1` on chart section to consume remaining space
- `min-height: 0` to allow flex items to shrink below content size
- `min-height: 300px` on chart as a floor for very small screens
- Parent containers must have defined height (100%) for this to work

## Files to Modify

| File                                         | Changes                                                           |
| -------------------------------------------- | ----------------------------------------------------------------- |
| `ui/src/components/BudgetDashboard.tsx`      | Add tab state, hidden resources state, render tabs, filter series |
| `ui/src/components/BudgetDashboard.css.ts`   | Tab styles, remove grid, add flex layout for full-height          |
| `ui/src/components/TimeSeriesChart.tsx`      | Clickable legend items, hidden state styling                      |
| `ui/src/components/TimeSeriesChart.css.ts`   | Clickable/hidden legend item styles                               |
| `ui/playwright/tests/save-selection.spec.ts` | Update assertions for new tab-based UI                            |

## Test Updates

- Update existing test that checks for category headings → check for tabs instead
- Add test: clicking tab switches displayed chart
- Add test: clicking legend item toggles line visibility
- Add test: chart container has expected dimensions

## No Changes Needed

- `useRealtimeBudget.ts` - data fetching unchanged
- `theme.css.ts` - colors already defined
- GraphQL schema - no backend changes
