import { Link, useParams } from '@tanstack/react-router'
import * as styles from './ViewMenu.css'

export const ViewMenu = (): React.ReactElement => {
  const params = useParams({ strict: false })
  const saveId = params.saveId

  if (!saveId) {
    return <></>
  }

  return (
    <nav className={styles.viewMenuContainer}>
      <h2 className={styles.viewMenuTitle}>Views</h2>
      <Link
        to='/saves/$saveId/empire_budget'
        params={{ saveId }}
        className={styles.viewMenuItem}
        activeProps={{
          className: `${styles.viewMenuItem} ${styles.viewMenuItemActive}`,
        }}
      >
        <svg
          className={styles.viewMenuIcon}
          viewBox='0 0 24 24'
          fill='currentColor'
        >
          <path d='M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z' />
        </svg>
        Empire Budget
      </Link>
    </nav>
  )
}
