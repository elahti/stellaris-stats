import { useQuery } from '@apollo/client/react'
import { Link, useParams } from '@tanstack/react-router'
import { GetSavesDocument } from '../graphql/generated/graphql'
import * as styles from './SaveList.css'

export const SaveList = (): React.ReactElement => {
  const { data, loading, error } = useQuery(GetSavesDocument)
  const params = useParams({ strict: false })
  const selectedFilename = params.saveId

  if (loading) {
    return <div className={styles.loadingText}>Loading saves...</div>
  }

  if (error) {
    return <div className={styles.errorText}>Error: {error.message}</div>
  }

  const saves = data?.saves ?? []

  return (
    <div className={styles.saveListContainer}>
      <h2 className={styles.saveListTitle}>Saves</h2>
      {saves.map((save) => (
        <Link
          key={save.saveId}
          to='/saves/$saveId/empire_budget'
          params={{ saveId: save.filename }}
          className={`${styles.saveItem} ${
            selectedFilename === save.filename ? styles.saveItemSelected : ''
          }`}
        >
          <h3 className={styles.saveName}>{save.name}</h3>
          <p className={styles.saveFilename}>{save.filename}</p>
        </Link>
      ))}
    </div>
  )
}
