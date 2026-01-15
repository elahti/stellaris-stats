import * as styles from './SplashScreen.css'

export const SplashScreen = (): React.ReactElement => (
  <div className={styles.splashContainer}>
    <h1 className={styles.splashTitle}>Stellaris Stats</h1>
    <p className={styles.splashSubtitle}>Select a save to begin</p>
  </div>
)
