import { globalStyle } from '@vanilla-extract/css'
import { vars } from './theme.css'

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
})

globalStyle('html, body', {
  height: '100%',
  width: '100%',
})

globalStyle('body', {
  backgroundColor: vars.color.void,
  color: vars.color.text,
  fontFamily: vars.font.body,
  fontSize: '14px',
  lineHeight: 1.5,
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
})

globalStyle('#root', {
  height: '100%',
  width: '100%',
})

globalStyle('h1, h2, h3', {
  fontFamily: vars.font.title,
  fontWeight: 600,
  color: vars.color.textBright,
})

globalStyle('h1', {
  fontSize: '2rem',
})

globalStyle('h2', {
  fontSize: '1.5rem',
})

globalStyle('h3', {
  fontSize: '1.25rem',
})

globalStyle('a', {
  color: vars.color.primary,
  textDecoration: 'none',
})

globalStyle('a:hover', {
  textDecoration: 'underline',
})

globalStyle('button', {
  fontFamily: vars.font.menu,
  cursor: 'pointer',
})

globalStyle('::-webkit-scrollbar', {
  width: '8px',
  height: '8px',
})

globalStyle('::-webkit-scrollbar-track', {
  background: vars.color.background,
})

globalStyle('::-webkit-scrollbar-thumb', {
  background: vars.color.border,
  borderRadius: vars.radius.sm,
})

globalStyle('::-webkit-scrollbar-thumb:hover', {
  background: vars.color.borderBright,
})
