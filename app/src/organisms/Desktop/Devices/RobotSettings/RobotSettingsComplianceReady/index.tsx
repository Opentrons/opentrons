import { ComplianceReadySoftwareSettings } from './ComplianceReadySoftwareSettings'
import { PersonalAccountSettings } from './PersonalAccountSettings'
import { UserManagement } from './UserManagement'

import styles from './robotsettingscomplianceready.module.css'

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
      <div className={styles.section}>
        <ComplianceReadySoftwareSettings robotName={robotName} />
      </div>
    </>
  )
}
