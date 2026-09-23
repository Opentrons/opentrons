import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { useUsersQuery } from '@opentrons/react-api-client'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { ComplianceReadySettings } from '/app/organisms/ODD/RobotSettingsDashboard/ComplianceReady/ComplianceReadySettings'
import { SettingsListButton } from '/app/organisms/ODD/RobotSettingsDashboard/ComplianceReady/SettingsListButton'
import { UserManagement } from '/app/organisms/ODD/RobotSettingsDashboard/ComplianceReady/UserManagement/UserManagement'
import { useLocalRobotName } from '/app/redux-resources/robots/hooks/useLocalRobotName'
import { useIsAdminForRobot, useLogout } from '/app/redux/robot-auth'

import { Account } from '../Account'
import styles from './adminhub.module.css'

import type { ReactNode } from 'react'

type AdminHubPages =
  'user_management' | 'crs_settings' | 'personal_account_settings'

export function AdminHub(): ReactNode {
  const robotName = useLocalRobotName()
  const isAdmin = useIsAdminForRobot(robotName ?? '')
  const navigate = useNavigate()
  const [selectedPage, setSelectedPage] = useState<AdminHubPages | null>(null)

  const { t } = useTranslation('device_settings')

  const logout = useLogout()

  const { data: users } = useUsersQuery()
  const usersData = users?.data ?? []

  if (!isAdmin || selectedPage === 'personal_account_settings') {
    return (
      <Account
        onBack={
          isAdmin
            ? () => {
                setSelectedPage(null)
              }
            : () => {
                navigate(-1)
              }
        }
      />
    )
  }

  if (selectedPage === 'crs_settings') {
    return (
      <ComplianceReadySettings
        onBack={() => {
          setSelectedPage(null)
        }}
      />
    )
  }
  if (selectedPage === 'user_management') {
    return (
      <UserManagement
        onClickBack={() => {
          setSelectedPage(null)
        }}
        users={usersData}
      />
    )
  }

  return (
    <div className={styles.container}>
      <ChildNavigation
        header={t('odd_admin_hub_title')}
        onClickBack={() => {
          navigate(-1)
        }}
        buttonText={'' + t('log_out')}
        onClickButton={logout}
        buttonType="tertiaryHighLight"
      />
      <div className={styles.content}>
        <SettingsListButton
          title={t('odd_personal_account_settings')}
          key="personal_account_settings"
          onClick={() => {
            setSelectedPage('personal_account_settings')
          }}
        />
        <SettingsListButton
          title={t('odd_user_management')}
          key="user_management"
          onClick={() => {
            setSelectedPage('user_management')
          }}
        />
        <SettingsListButton
          title={t('odd_compliance_ready_software_settings')}
          key="crs_settings"
          onClick={() => {
            setSelectedPage('crs_settings')
          }}
        />
      </div>
    </div>
  )
}
