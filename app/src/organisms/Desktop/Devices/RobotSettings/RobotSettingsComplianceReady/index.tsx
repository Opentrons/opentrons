import { PersonalAccountSettings } from './PersonalAccountSettings'
import styles from './robotsettingscomplianceready.module.css'
import { UserManagement } from './UserManagement'

import type { JSX } from 'react'

export interface RobotSettingsComplianceReadyProps {
  robotName: string
  isRobotBusy: boolean
}

export function RobotSettingsComplianceReady({
  robotName,
}: RobotSettingsComplianceReadyProps): JSX.Element {
  return (
    <>
      <div className={styles.section}>
          <PersonalAccountSettings robotName={robotName} />
      </div>
      <div className={styles.section}>
          <UserManagement robotName={robotName} />
      </div>
    </>
  )
}
