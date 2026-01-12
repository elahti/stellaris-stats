import { style } from '@vanilla-extract/css'
import { vars } from '../styles/theme.css'

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

export const dashboardHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
})

export const dashboardTitle = style({
  fontFamily: vars.font.title,
  fontSize: '1.75rem',
  color: vars.color.primary,
  margin: 0,
})

export const saveName = style({
  fontFamily: vars.font.menu,
  fontSize: '1.1rem',
  color: vars.color.text,
})

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

export const loadingContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space.xl,
  color: vars.color.textMuted,
  fontFamily: vars.font.body,
})

export const errorContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space.xl,
  color: vars.color.error,
  fontFamily: vars.font.body,
})

export const noDataContainer = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.space.xl,
  color: vars.color.textMuted,
  fontFamily: vars.font.body,
})
