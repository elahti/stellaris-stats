import { style } from '@vanilla-extract/css'
import { vars } from '../styles/theme.css'

export const viewMenuContainer = style({
  display: 'flex',
  flexDirection: 'column',
  padding: vars.space.lg,
  width: 'fit-content',
  flexShrink: 0,
  borderRight: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.background,
})

export const viewMenuTitle = style({
  fontFamily: vars.font.title,
  fontSize: '1.5rem',
  color: vars.color.primary,
  margin: 0,
  marginBottom: vars.space.md,
})

export const viewMenuItem = style({
  'display': 'flex',
  'alignItems': 'center',
  'gap': vars.space.sm,
  'padding': '10px 12px',
  'borderRadius': vars.radius.sm,
  'cursor': 'pointer',
  'fontFamily': vars.font.menu,
  'fontSize': '13px',
  'color': vars.color.textMuted,
  'textDecoration': 'none',
  'transition': 'all 0.2s',
  'whiteSpace': 'nowrap',
  ':hover': {
    backgroundColor: vars.color.surfaceHover,
    color: vars.color.text,
  },
})

export const viewMenuItemActive = style({
  backgroundColor: vars.color.surface,
  color: vars.color.text,
})

export const viewMenuIcon = style({
  width: '16px',
  height: '16px',
  opacity: 0.7,
  flexShrink: 0,
})
