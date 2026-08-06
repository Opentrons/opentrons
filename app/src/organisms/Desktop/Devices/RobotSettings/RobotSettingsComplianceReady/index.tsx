import { useIsAdminForRobot } from '/app/redux/robot-auth/hooks'

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
  const isAdmin = useIsAdminForRobot(robotName)

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <PersonalAccountSettings robotName={robotName} />
      </div>
      {isAdmin ? (
        <div className={`${styles.section} ${styles.section_accordion}`}>
          <UserManagement robotName={robotName} />
        </div>
      ) : null}
      {isAdmin ? (
        <div className={`${styles.section} ${styles.section_accordion}`}>
          <ComplianceReadySoftwareSettings robotName={robotName} />
        </div>
      ) : null}
    </div>
  )
}
