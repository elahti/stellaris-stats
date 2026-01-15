import { createFileRoute } from '@tanstack/react-router'
import { SplashScreen } from '../components'

export const Route = createFileRoute('/')({
  component: SplashScreen,
})
