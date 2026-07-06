import { ProtocolRunRecords } from './ProtocolRunRecords'
import styles from './robotsettingsfilemanager.module.css'
import { RobotStorage } from './RobotStorage'

export function RobotSettingsFileManager(): JSX.Element {
  return (
    <div className={styles.container}>
      <RobotStorage />
      <ProtocolRunRecords />
    </div>
  )
}
