# UI Theme Centralization Design

## Overview

Centralize font sizes and chart configuration in the vanilla-extract theme system, improving maintainability and fixing visual issues with chart axes and zero line.

## Goals

1. Draw horizontal line at y=0 in white (`#ffffff`) matching text color
2. Increase axis label size from 12px to 16px for better readability
3. Centralize font sizes in theme with semantic scale
4. Eliminate duplication between theme and `chartColors`

## Design

### Theme Structure

Restructure `theme.css.ts` to define raw values first, then derive both CSS theme and chart config:

```typescript
const themeValues = {
  fontSize: {
    md: '16px', // Body text, axis labels
    lg: '20px', // h3, subheadings
    xl: '24px', // h2, section headings
    xxl: '32px', // h1, page titles
  },
  color: {
    text: '#e8e8e8',
    textBright: '#ffffff',
    textMuted: '#8899aa',
    // ... existing colors
  },
  // ... font, space, radius, shadow as before
}

export const [themeClass, vars] = createTheme(themeValues)
```

### Chart Configuration

New `chartConfig` export derives values from `themeValues`:

```typescript
export const chartConfig = {
  colors: {
    text: themeValues.color.textBright, // Axis labels (was #e8e8e8)
    zeroLine: themeValues.color.textBright, // Horizontal line at y=0
    grid: 'rgba(70, 130, 180, 0.15)', // Grid lines
    energy: themeValues.color.energy,
    minerals: themeValues.color.minerals,
    // ... resource colors
  },
  fontSize: {
    axis: themeValues.fontSize.md, // 16px (was 12px)
  },
}
```

### TimeSeriesChart Updates

Use `chartConfig` for axis styling:

```typescript
axes: [
  {
    stroke: chartConfig.colors.text,
    font: `${chartConfig.fontSize.axis} ${vars.font.body}`,
    grid: { stroke: chartConfig.colors.grid, width: 1 },
    ticks: { stroke: chartConfig.colors.grid, width: 1 },
  },
  // y-axis similar
]
```

Zero line via uPlot draw hook:

```typescript
hooks: {
  draw: [
    (u) => {
      const ctx = u.ctx
      const y0 = u.valToPos(0, 'y', true)
      if (y0 >= u.bbox.top && y0 <= u.bbox.top + u.bbox.height) {
        ctx.strokeStyle = chartConfig.colors.zeroLine
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(u.bbox.left, y0)
        ctx.lineTo(u.bbox.left + u.bbox.width, y0)
        ctx.stroke()
      }
    },
  ]
}
```

### Global Styles Update

Use `vars.fontSize` in `global.css.ts`:

```typescript
globalStyle('h1', {
  fontSize: vars.fontSize.xxl, // Was '2rem'
})

globalStyle('h2', {
  fontSize: vars.fontSize.xl, // Was '1.5rem'
})

globalStyle('h3', {
  fontSize: vars.fontSize.lg, // Was '1.25rem'
})
```

## Files to Modify

| File                                    | Changes                                                          |
| --------------------------------------- | ---------------------------------------------------------------- |
| `ui/src/styles/theme.css.ts`            | Add `themeValues` object, `fontSize` scale, `chartConfig` export |
| `ui/src/styles/global.css.ts`           | Use `vars.fontSize.*` for h1/h2/h3                               |
| `ui/src/components/TimeSeriesChart.tsx` | Use `chartConfig`, add zero line draw hook                       |

## Behavior Changes

- Zero line at y=0 drawn in white (`#ffffff`)
- Axis labels: 12px → 16px
- Axis stroke: `#e8e8e8` → `#ffffff`
- All values centralized in `themeValues`

## Backwards Compatibility

- `vars` API unchanged - existing component code continues working
- `chartColors` can be removed or kept as alias
