import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { useIsAdminForRobot } from '/app/redux/robot-auth/hooks'

import { ComplianceReadySoftwareSettings } from './ComplianceReadySoftwareSettings'
import { PersonalAccountSettings } from './PersonalAccountSettings'
import styles from './robotsettingscomplianceready.module.css'
import { OneTimePasswordModal } from './userAccount/OneTimePasswordModal'
import { UserManagement } from './UserManagement'

import type { JSX } from 'react'

export interface RobotSettingsComplianceReadyProps {
  robotName: string
}

export function RobotSettingsComplianceReady({
  robotName,
}: RobotSettingsComplianceReadyProps): JSX.Element {
  const { t } = useTranslation('device_settings')
  const isAdmin = useIsAdminForRobot(robotName)
  const [oneTimePassword, setOneTimePassword] = useState<string | null>(null)

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <PersonalAccountSettings robotName={robotName} />
      </div>
      {isAdmin ? (
        <div
          className={`${styles.section} ${styles.section_accordion} ${styles.section_accordion_overflow_visible}`}
        >
          <UserManagement
            robotName={robotName}
            onShowOneTimePassword={setOneTimePassword}
          />
        </div>
      ) : null}
      {isAdmin ? (
        <div className={`${styles.section} ${styles.section_accordion}`}>
          <ComplianceReadySoftwareSettings robotName={robotName} />
        </div>
      ) : null}
      {/*
        Keep the OTP modal at this level so it survives auth clearing.
        Resetting a password revokes that user's tokens; if it's the logged-in
        admin, isAdmin becomes false and UserManagement unmounts.
      */}
      {oneTimePassword != null ? (
        <OneTimePasswordModal
          password={oneTimePassword}
          message={
            t('desktop_reset_password_one_time_password_message') as string
          }
          onConfirm={() => {
            setOneTimePassword(null)
          }}
          onClose={() => {
            setOneTimePassword(null)
          }}
        />
      ) : null}
    </div>
  )
}
