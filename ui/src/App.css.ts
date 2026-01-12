import { style } from '@vanilla-extract/css'
import { vars } from './styles/theme.css'

export const appContainer = style({
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
  backgroundColor: vars.color.background,
})

export const sidebar = style({
  width: '300px',
  flexShrink: 0,
  borderRight: `1px solid ${vars.color.border}`,
  backgroundColor: vars.color.surface,
  overflowY: 'auto',
})

export const mainContent = style({
  flex: 1,
  minHeight: 0,
  overflow: 'hidden',
})

export const welcomeContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: vars.space.xl,
  textAlign: 'center',
})

export const welcomeTitle = style({
  fontFamily: vars.font.title,
  fontSize: '2rem',
  color: vars.color.primary,
  margin: 0,
  marginBottom: vars.space.md,
})

export const welcomeText = style({
  fontFamily: vars.font.body,
  fontSize: '1.1rem',
  color: vars.color.textMuted,
  maxWidth: '400px',
})
