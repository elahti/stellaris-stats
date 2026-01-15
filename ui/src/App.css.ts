import { style } from '@vanilla-extract/css'
import { vars } from './styles/theme.css'

export const appContainer = style({
  display: 'flex',
  height: '100vh',
  overflow: 'hidden',
  backgroundColor: vars.color.background,
})

export const saveSidebar = style({
  width: 'fit-content',
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
