import styles from './robotsettingsfilemanager.module.css'
import { RobotStorage } from './RobotStorage'

export function RobotSettingsFileManager(): JSX.Element {
  return (
    <div className={styles.container}>
      <RobotStorage />
      {/* TODO: add other file management sections */}
    </div>
  )
}
