import { createTheme, style } from '@vanilla-extract/css'

// Raw color values for canvas-based charting (uPlot, etc.)
// These are needed because canvas APIs don't understand CSS variables
export const chartColors = {
  // Text color for axis labels (canvas APIs need raw hex, not CSS vars)
  text: '#e8e8e8',
  // Resource colors
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
} as const

export const [themeClass, vars] = createTheme({
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
})

export const panel = style({
  backgroundColor: vars.color.surface,
  border: `1px solid ${vars.color.border}`,
  boxShadow: vars.shadow.panel,
  backdropFilter: 'blur(8px)',
  borderRadius: vars.radius.sm,
})
