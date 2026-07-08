import { useSelfQuery } from '@opentrons/react-api-client'

import { useUsernameForRobot } from '/app/redux/robot-auth/hooks'

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
  const username = useUsernameForRobot(robotName)
  const selfQuery = useSelfQuery({ enabled: username != null })
  const isAdmin =
    username != null && selfQuery.data?.data.accountType === 'admin'

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <PersonalAccountSettings robotName={robotName} />
      </div>
      {isAdmin ? (
        <div className={`${styles.section} ${styles.section_accordion}`}>
          <UserManagement />
        </div>
      ) : null}
      <div className={`${styles.section} ${styles.section_accordion}`}>
        <ComplianceReadySoftwareSettings robotName={robotName} />
      </div>
    </div>
  )
}
