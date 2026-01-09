import { useState } from 'react'
import './styles/global.css'
import { themeClass } from './styles/theme.css'
import { SaveList, BudgetDashboard } from './components'
import * as styles from './App.css'

export const App = (): React.ReactElement => {
  const [selectedFilename, setSelectedFilename] = useState<string>()

  return (
    <div className={`${themeClass} ${styles.appContainer}`}>
      <aside className={styles.sidebar}>
        <SaveList
          selectedFilename={selectedFilename}
          onSelectSave={setSelectedFilename}
        />
      </aside>
      <main className={styles.mainContent}>
        {selectedFilename ? (
          <BudgetDashboard filename={selectedFilename} />
        ) : (
          <div className={styles.welcomeContainer}>
            <h1 className={styles.welcomeTitle}>Stellaris Stats</h1>
            <p className={styles.welcomeText}>
              Select a save from the sidebar to view empire budget over time
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
