# UI Theme Centralization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Centralize font sizes in theme, fix chart axis readability, and add zero line at y=0.

**Architecture:** Restructure theme.css.ts to define raw values first (`themeValues`), then derive both CSS theme (`vars`) and chart configuration (`chartConfig`) from those values. This eliminates duplication and creates a single source of truth.

**Tech Stack:** vanilla-extract, uPlot, React

---

## Task 1: Restructure theme.css.ts with themeValues and fontSize

**Files:**

- Modify: `ui/src/styles/theme.css.ts:1-109`

**Step 1: Create themeValues object with fontSize scale**

Replace the current structure. The file should start with `themeValues`, then derive `createTheme` and `chartConfig` from it.

```typescript
import { createTheme, style } from '@vanilla-extract/css'

// Raw theme values - single source of truth
// Used by both CSS variables (vars) and canvas-based charts (chartConfig)
const themeValues = {
  fontSize: {
    md: '16px', // Body text, axis labels
    lg: '20px', // h3, subheadings
    xl: '24px', // h2, section headings
    xxl: '32px', // h1, page titles
  },

  color: {
    // Backgrounds
    void: '#05080a',
    background: '#0c1014',
    surface: 'rgba(20, 30, 40, 0.85)',
    surfaceHover: 'rgba(30, 45, 60, 0.9)',

    // Accents
    primary: '#00e696',
    primaryGlow: 'rgba(0, 230, 150, 0.3)',
    secondary: '#4a9eff',

    // Text
    text: '#e8e8e8',
    textMuted: '#8899aa',
    textBright: '#ffffff',

    // Borders
    border: 'rgba(70, 130, 180, 0.4)',
    borderBright: 'rgba(0, 230, 150, 0.6)',

    // Resources
    energy: '#f4c542',
    minerals: '#e63946',
    food: '#7cb518',
    alloys: '#c77dff',
    consumerGoods: '#ff922b',
    unity: '#22d3ee',
    influence: '#a64d79',
    trade: '#8ab8ff',
    rareCrystals: '#e84393',
    exoticGases: '#00cec9',
    volatileMotes: '#fdcb6e',
    srDarkMatter: '#9b59b6',
    srLivingMetal: '#a0a0a0',
    srZro: '#5dade2',
    physicsResearch: '#3274a1',
    societyResearch: '#55efc4',
    engineeringResearch: '#fab1a0',

    // Status
    success: '#00e696',
    warning: '#f4c542',
    error: '#e63946',
  },

  font: {
    menu: '"Jura", sans-serif',
    title: '"Orbitron", sans-serif',
    heading: '"Malgun Gothic", "Century Gothic", sans-serif',
    body: '"Century Gothic", "Segoe UI", sans-serif',
    mono: '"Consolas", "Monaco", monospace',
  },

  space: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },

  radius: {
    sm: '4px',
    md: '8px',
  },

  shadow: {
    panel: '0 0 20px rgba(0, 230, 150, 0.1), inset 0 0 60px rgba(0, 0, 0, 0.5)',
    glow: '0 0 10px currentColor',
  },
} as const

export const [themeClass, vars] = createTheme(themeValues)

// Chart configuration - derived from themeValues
// Canvas APIs (uPlot) need raw values, not CSS variables
export const chartConfig = {
  colors: {
    text: themeValues.color.textBright,
    zeroLine: themeValues.color.textBright,
    grid: 'rgba(70, 130, 180, 0.15)',
    energy: themeValues.color.energy,
    minerals: themeValues.color.minerals,
    food: themeValues.color.food,
    alloys: themeValues.color.alloys,
    consumerGoods: themeValues.color.consumerGoods,
    unity: themeValues.color.unity,
    influence: themeValues.color.influence,
    trade: themeValues.color.trade,
    rareCrystals: themeValues.color.rareCrystals,
    exoticGases: themeValues.color.exoticGases,
    volatileMotes: themeValues.color.volatileMotes,
    srDarkMatter: themeValues.color.srDarkMatter,
    srLivingMetal: themeValues.color.srLivingMetal,
    srZro: themeValues.color.srZro,
    physicsResearch: themeValues.color.physicsResearch,
    societyResearch: themeValues.color.societyResearch,
    engineeringResearch: themeValues.color.engineeringResearch,
  },
  fontSize: {
    axis: themeValues.fontSize.md,
  },
} as const

// Legacy alias for backwards compatibility
export const chartColors = chartConfig.colors

export const panel = style({
  backgroundColor: vars.color.surface,
  border: `1px solid ${vars.color.border}`,
  boxShadow: vars.shadow.panel,
  backdropFilter: 'blur(8px)',
  borderRadius: vars.radius.sm,
})
```

**Step 2: Verify build passes**

Run: `npm run ui:build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add ui/src/styles/theme.css.ts
git commit -m "refactor(ui): restructure theme with themeValues and add fontSize scale"
```

---

## Task 2: Update global.css.ts to use vars.fontSize

**Files:**

- Modify: `ui/src/styles/global.css.ts:36-46`

**Step 1: Update h1/h2/h3 font sizes**

Replace the hardcoded rem values with theme variables:

```typescript
globalStyle('h1', {
  fontSize: vars.fontSize.xxl,
})

globalStyle('h2', {
  fontSize: vars.fontSize.xl,
})

globalStyle('h3', {
  fontSize: vars.fontSize.lg,
})
```

**Step 2: Verify build passes**

Run: `npm run ui:build`
Expected: Build succeeds with no errors

**Step 3: Commit**

```bash
git add ui/src/styles/global.css.ts
git commit -m "refactor(ui): use theme fontSize variables for headings"
```

---

## Task 3: Update TimeSeriesChart to use chartConfig

**Files:**

- Modify: `ui/src/components/TimeSeriesChart.tsx:4,65-90`

**Step 1: Update import**

Change line 4 from:

```typescript
import { vars, chartColors } from '../styles/theme.css'
```

To:

```typescript
import { vars, chartConfig } from '../styles/theme.css'
```

**Step 2: Update axis configuration in createChartOptions**

Replace the axes configuration (lines 65-91) with:

```typescript
  axes: [
    {
      stroke: chartConfig.colors.text,
      grid: {
        stroke: chartConfig.colors.grid,
        width: 1,
      },
      ticks: {
        stroke: chartConfig.colors.grid,
        width: 1,
      },
      font: `${chartConfig.fontSize.axis} ${vars.font.body}`,
      values: (_self, ticks) => ticks.map((t) => formatGameDate(t * 1000)),
    },
    {
      stroke: chartConfig.colors.text,
      grid: {
        stroke: chartConfig.colors.grid,
        width: 1,
      },
      ticks: {
        stroke: chartConfig.colors.grid,
        width: 1,
      },
      font: `${chartConfig.fontSize.axis} ${vars.font.body}`,
    },
  ],
```

**Step 3: Verify build passes**

Run: `npm run ui:build`
Expected: Build succeeds with no errors

**Step 4: Commit**

```bash
git add ui/src/components/TimeSeriesChart.tsx
git commit -m "refactor(ui): use chartConfig for axis styling"
```

---

## Task 4: Add zero line draw hook to TimeSeriesChart

**Files:**

- Modify: `ui/src/components/TimeSeriesChart.tsx:57-64`

**Step 1: Add draw hook for zero line**

The current hooks section (lines 57-64) is:

```typescript
  hooks: {
    setCursor: [
      (u) => {
        const idx = u.cursor.idx
        onHoverChange(idx === undefined ? null : idx)
      },
    ],
  },
```

Replace with:

```typescript
  hooks: {
    setCursor: [
      (u) => {
        const idx = u.cursor.idx
        onHoverChange(idx === undefined ? null : idx)
      },
    ],
    draw: [
      (u) => {
        const ctx = u.ctx
        const y0 = u.valToPos(0, 'y', true)
        if (y0 >= u.bbox.top && y0 <= u.bbox.top + u.bbox.height) {
          ctx.save()
          ctx.strokeStyle = chartConfig.colors.zeroLine
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.moveTo(u.bbox.left, y0)
          ctx.lineTo(u.bbox.left + u.bbox.width, y0)
          ctx.stroke()
          ctx.restore()
        }
      },
    ],
  },
```

**Step 2: Verify build passes**

Run: `npm run ui:build`
Expected: Build succeeds with no errors

**Step 3: Run E2E tests to verify charts still render**

Run: `npm run test:ci:e2e`
Expected: All tests pass

**Step 4: Commit**

```bash
git add ui/src/components/TimeSeriesChart.tsx
git commit -m "feat(ui): add white zero line to charts"
```

---

## Task 5: Manual visual verification

**Step 1: Start dev server**

Run: `npm run ui:dev`

**Step 2: Verify changes visually**

Check:

- [ ] Axis labels are larger (16px instead of 12px)
- [ ] Axis labels are bright white (#ffffff)
- [ ] Zero line appears as white horizontal line when chart crosses y=0
- [ ] Headings (h1, h2, h3) render at correct sizes

**Step 3: Stop dev server**

Press Ctrl+C to stop

---

## Summary

| Task | Description                                     | Commit                                                                    |
| ---- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| 1    | Restructure theme with themeValues and fontSize | `refactor(ui): restructure theme with themeValues and add fontSize scale` |
| 2    | Update global.css.ts to use vars.fontSize       | `refactor(ui): use theme fontSize variables for headings`                 |
| 3    | Update TimeSeriesChart to use chartConfig       | `refactor(ui): use chartConfig for axis styling`                          |
| 4    | Add zero line draw hook                         | `feat(ui): add white zero line to charts`                                 |
| 5    | Manual visual verification                      | (no commit)                                                               |
