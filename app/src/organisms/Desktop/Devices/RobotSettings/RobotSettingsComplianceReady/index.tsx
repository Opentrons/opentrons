import { useCallback, useRef, useState } from 'react'
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

  // In the user management section, if an admin tries to edit their own account,
  // we navigate to the personal account settings section instead of popping the modal.
  const [isEditingPersonalAccount, setIsEditingPersonalAccount] =
    useState(false)
  const [showAdminWarningBanner, setShowAdminWarningBanner] = useState(false)

  const personalAccountRef = useRef<HTMLDivElement>(null)
  const handleEditSelf = useCallback((): void => {
    setIsEditingPersonalAccount(true)
    personalAccountRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    setShowAdminWarningBanner(true)
  }, [])

  const handleSetIsEditing = useCallback((isEditing: boolean): void => {
    setIsEditingPersonalAccount(isEditing)
    if (!isEditing) {
      setShowAdminWarningBanner(false)
    }
  }, [])

  return (
    <div className={styles.page}>
      <div className={styles.section}>
        <PersonalAccountSettings
          viewRef={personalAccountRef}
          robotName={robotName}
          isEditing={isEditingPersonalAccount}
          setIsEditing={handleSetIsEditing}
          showAdminWarningBanner={showAdminWarningBanner}
        />
      </div>
      {isAdmin ? (
        <div
          className={`${styles.section} ${styles.section_accordion} ${styles.section_accordion_overflow_visible}`}
        >
          <UserManagement
            robotName={robotName}
            onShowOneTimePassword={setOneTimePassword}
            onEditSelf={handleEditSelf}
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
