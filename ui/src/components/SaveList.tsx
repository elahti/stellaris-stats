import { useQuery } from '@apollo/client/react'
import { graphql } from '../graphql/generated'
import * as styles from './SaveList.css'

const GET_SAVES = graphql(`
  query GetSaves {
    saves {
      saveId
      filename
      name
    }
  }
`)

export interface SaveListProps {
  selectedFilename?: string
  onSelectSave: (filename: string) => void
}

export const SaveList = ({
  selectedFilename,
  onSelectSave,
}: SaveListProps): React.ReactElement => {
  const { data, loading, error } = useQuery(GET_SAVES)

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
        <div
          key={save.saveId}
          className={`${styles.saveItem} ${
            selectedFilename === save.filename ? styles.saveItemSelected : ''
          }`}
          onClick={() => onSelectSave(save.filename)}
        >
          <h3 className={styles.saveName}>{save.name}</h3>
          <p className={styles.saveFilename}>{save.filename}</p>
        </div>
      ))}
    </div>
  )
}
