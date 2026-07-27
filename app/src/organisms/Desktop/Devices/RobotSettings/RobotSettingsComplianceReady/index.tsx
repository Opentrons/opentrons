import { ComplianceReadySoftwareSettings } from './ComplianceReadySoftwareSettings'
import { PersonalAccountSettings } from './PersonalAccountSettings'
import styles from './robotsettingscomplianceready.module.css'
import { UserManagement } from './UserManagement'

import type { JSX } from 'react'

export interface RobotSettingsComplianceReadyProps {
  robotName: string
}

export function RobotSettingsComplianceReady({
  robotName,
}: RobotSettingsComplianceReadyProps): JSX.Element {
  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <PersonalAccountSettings robotName={robotName} />
      </div>
      <div className={`${styles.section} ${styles.section_accordion}`}>
        <UserManagement robotName={robotName} />
      </div>
      <div className={`${styles.section} ${styles.section_accordion}`}>
        <ComplianceReadySoftwareSettings robotName={robotName} />
      </div>
    </div>
  )
}
