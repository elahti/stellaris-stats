import { style } from '@vanilla-extract/css'
import { vars } from '../styles/theme.css'

export const splashContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  padding: vars.space.xl,
  textAlign: 'center',
})

export const splashTitle = style({
  fontFamily: vars.font.title,
  fontSize: '4.5rem',
  fontWeight: 700,
  color: vars.color.primary,
  textTransform: 'uppercase',
  letterSpacing: '8px',
  textShadow: `0 0 40px ${vars.color.primaryGlow}`,
  margin: 0,
  marginBottom: vars.space.md,
})

export const splashSubtitle = style({
  fontFamily: vars.font.body,
  fontSize: '1rem',
  color: vars.color.textMuted,
  letterSpacing: '2px',
  textTransform: 'uppercase',
})
