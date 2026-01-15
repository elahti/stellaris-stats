import { createRootRoute, Outlet } from '@tanstack/react-router'
import '../styles/global.css'
import { themeClass } from '../styles/theme.css'
import { SaveList, ViewMenu } from '../components'
import * as styles from '../App.css'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout(): React.ReactElement {
  return (
    <div className={`${themeClass} ${styles.appContainer}`}>
      <aside className={styles.saveSidebar}>
        <SaveList />
      </aside>
      <ViewMenu />
      <main className={styles.mainContent}>
        <Outlet />
      </main>
    </div>
  )
}
