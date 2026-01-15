import { style, globalStyle } from '@vanilla-extract/css'
import { vars } from '../styles/theme.css'

// Override uPlot's default title styling for better readability
globalStyle('.u-title', {
  color: vars.color.text,
})

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

export const chartWrapper = style({
  position: 'relative',
  width: '100%',
  flex: 1,
  minHeight: '300px',
})

export const legend = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: vars.space.sm,
  padding: vars.space.sm,
})

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

export const legendColor = style({
  width: '12px',
  height: '12px',
  borderRadius: '2px',
  flexShrink: 0,
})

export const legendLabel = style({
  whiteSpace: 'nowrap',
})

export const legendValue = style({
  fontFamily: vars.font.mono,
  fontSize: '0.85rem',
  color: vars.color.text,
  minWidth: '80px',
  textAlign: 'right',
  marginLeft: 'auto',
})
