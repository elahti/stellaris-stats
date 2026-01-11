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
  maxWidth: '280px',
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
