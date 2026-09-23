import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  useAuditSettingsMutation,
  useAuditSettingsQuery,
  useAuthSettingsMutation,
  useAuthSettingsQuery,
  useGetRobotServerAccessControlSettingsQuery,
  usePatchRobotServerAccessControlSettingsMutation,
  useUsersQuery,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'
import { useLogout } from '/app/redux/robot-auth'

import { AdminActions } from './AdminActions'
import { AuditLogRequirements } from './AuditLogRequirements'
import styles from './compliance_ready_settings.module.css'
import { LoginSettings } from './LoginSettings'
import { RobotStorage } from './RobotStorage'
import { SettingsListButton } from './SettingsListButton'
import { UserManagement } from './UserManagement/UserManagement'

import type { ReactNode } from 'react'
import type {
  AuditSettingsData,
  AuthSettingsData,
  RobotServerAccessControlSettingsData,
} from '@opentrons/api-client'

export type CRSSettingsPages = 'users' | 'login' | 'admin' | 'storage' | 'audit'

export function ComplianceReadySettings({
  onBack,
}: {
  onBack: () => void
}): ReactNode {
  const { t } = useTranslation('device_settings')

  const { data: robotServerSettings } =
    useGetRobotServerAccessControlSettingsQuery()
  const { data: authSettings } = useAuthSettingsQuery()
  const { data: auditSettings } = useAuditSettingsQuery()

  const logout = useLogout()

  const documentationState = useDocumentationState()
  const { mutate: patchAuthSettings } = useAuthSettingsMutation(
    documentationState,
    {
      onSuccess: data => {
        if (data.meta.requiresLogout) {
          logout()
        }
      },
    }
  )
  const { mutate: patchRobotServerSettings } =
    usePatchRobotServerAccessControlSettingsMutation(documentationState)
  const { mutate: patchAuditSettings } =
    useAuditSettingsMutation(documentationState)
  const [currentPage, setCurrentPage] = useState<CRSSettingsPages | null>(null)

  const settingsPageNames: { [key in CRSSettingsPages]: string } = {
    users: t('odd_users_title'),
    login: t('odd_login_title'),
    admin: t('odd_admin_title'),
    audit: t('odd_audit_title'),
    storage: t('odd_storage_title'),
  }

  const handlePatchAuthSettings =
    handlePatchSettingsIfChanged<AuthSettingsData>(
      authSettings?.data,
      patchAuthSettings
    )
  const handlePatchRobotServerSettings =
    handlePatchSettingsIfChanged<RobotServerAccessControlSettingsData>(
      robotServerSettings?.data,
      patchRobotServerSettings
    )
  const handlePatchAuditSettings =
    handlePatchSettingsIfChanged<AuditSettingsData>(
      auditSettings?.data,
      patchAuditSettings
    )

  const { data: users } = useUsersQuery()
  const usersData = users?.data ?? []

  const pages = Object.keys(settingsPageNames) as CRSSettingsPages[]

  switch (currentPage) {
    case 'users':
      return (
        <UserManagement
          users={usersData}
          onClickBack={() => {
            setCurrentPage(null)
          }}
        />
      )
    case 'login':
      return (
        <LoginSettings
          authSettings={authSettings?.data}
          onClickBack={() => {
            setCurrentPage(null)
          }}
          patchAuthSettings={handlePatchAuthSettings}
        />
      )
    case 'admin':
      return (
        <AdminActions
          authSettings={authSettings?.data}
          patchAuthSettings={handlePatchAuthSettings}
          onClickBack={() => {
            setCurrentPage(null)
          }}
        />
      )
    case 'audit':
      return (
        <AuditLogRequirements
          auditSettings={auditSettings?.data}
          patchAuditSettings={handlePatchAuditSettings}
          robotServerSettings={robotServerSettings?.data}
          patchRobotServerSettings={handlePatchRobotServerSettings}
          onClickBack={() => {
            setCurrentPage(null)
          }}
        />
      )
    case 'storage':
      return (
        <RobotStorage
          robotServerSettings={robotServerSettings?.data}
          patchRobotServerSettings={handlePatchRobotServerSettings}
          onClickBack={onBack}
        />
      )
    default:
      return (
        <div className={styles.container}>
          <ChildNavigation
            header={t('odd_compliance_ready_software')}
            onClickBack={onBack}
          />
          <div className={styles.content}>
            <div className={styles.settings_list}>
              {pages.map(page => (
                <SettingsListButton
                  key={page}
                  title={settingsPageNames[page]}
                  onClick={() => {
                    setCurrentPage(page)
                  }}
                  chevron
                />
              ))}
            </div>
          </div>
        </div>
      )
  }
}

function handlePatchSettingsIfChanged<T>(
  settings: T | undefined,
  patchSettings: (request: { data: Partial<T> }) => void
): (newSettings: Partial<T>) => void {
  return (newSettings: Partial<T>) => {
    if (
      Object.entries(newSettings).some(
        ([key, value]) => value !== settings?.[key as keyof T]
      )
    ) {
      patchSettings({ data: newSettings })
    }
  }
}
