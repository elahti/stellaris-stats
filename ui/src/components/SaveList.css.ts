import { style } from '@vanilla-extract/css'
import { vars } from '../styles/theme.css'

export const saveListContainer = style({
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md,
  padding: vars.space.lg,
})

export const saveListTitle = style({
  fontFamily: vars.font.title,
  fontSize: '1.5rem',
  color: vars.color.primary,
  margin: 0,
  marginBottom: vars.space.md,
})

export const saveItem = style({
  'display': 'flex',
  'flexDirection': 'column',
  'gap': vars.space.xs,
  'padding': vars.space.md,
  'backgroundColor': vars.color.surface,
  'border': `1px solid ${vars.color.border}`,
  'borderRadius': vars.radius.sm,
  'cursor': 'pointer',
  'transition': 'all 0.2s ease',
  'textDecoration': 'none',
  ':hover': {
    backgroundColor: vars.color.surfaceHover,
    borderColor: vars.color.borderBright,
    boxShadow: vars.shadow.glow,
  },
})

export const saveItemSelected = style({
  borderColor: vars.color.primary,
  backgroundColor: vars.color.surfaceHover,
})

export const saveName = style({
  fontFamily: vars.font.menu,
  fontSize: '1.1rem',
  color: vars.color.text,
  margin: 0,
  whiteSpace: 'nowrap',
})

export const saveFilename = style({
  fontFamily: vars.font.body,
  fontSize: '0.85rem',
  color: vars.color.textMuted,
  margin: 0,
  whiteSpace: 'nowrap',
})

export const loadingText = style({
  color: vars.color.textMuted,
  fontFamily: vars.font.body,
})

export const errorText = style({
  color: vars.color.error,
  fontFamily: vars.font.body,
})
