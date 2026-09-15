import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  useAuditSettingsMutation,
  useAuditSettingsQuery,
  useAuthSettingsMutation,
  useAuthSettingsQuery,
  useGetRobotServerAccessControlSettingsQuery,
  usePatchRobotServerAccessControlSettingsMutation,
} from '@opentrons/react-api-client'

import { useDocumentationState } from '/app/local-resources/access-control/useDocumentationState'
import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import { AdminActions } from './AdminActions'
import { AuditLogRequirements } from './AuditLogRequirements'
import styles from './compliance_ready_settings.module.css'
import { LoginSettings } from './LoginSettings'
import { RobotStorage } from './RobotStorage'
import { SettingsListButton } from './SettingsListButton'

import type { ReactNode } from 'react'
import type {
  AuditSettingsData,
  AuthSettingsData,
  RobotServerAccessControlSettingsData,
} from '@opentrons/api-client'
import type { SetSettingOption } from '../types'

export type CRSSettingsPages = 'users' | 'login' | 'admin' | 'storage' | 'audit'

export function ComplianceReadySettings({
  setCurrentOption,
}: {
  setCurrentOption: SetSettingOption
}): ReactNode {
  const { t } = useTranslation('device_settings')

  const { data: robotServerSettings } =
    useGetRobotServerAccessControlSettingsQuery()
  const { data: authSettings } = useAuthSettingsQuery()
  const { data: auditSettings } = useAuditSettingsQuery()

  const documentationState = useDocumentationState()
  const { mutate: patchAuthSettings } =
    useAuthSettingsMutation(documentationState)
  const { mutate: patchRobotServerSettings } =
    usePatchRobotServerAccessControlSettingsMutation(documentationState)
  const { mutate: patchAuditSettings } =
    useAuditSettingsMutation(documentationState)
  const [currentPage, setCurrentPage] = useState<CRSSettingsPages | null>(null)

  const settingsPageNames: { [key in CRSSettingsPages]: string } = {
    users: t('users_title'),
    login: t('login_title'),
    admin: t('admin_title'),
    audit: t('audit_title'),
    storage: t('storage_title'),
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

  const pages = Object.keys(settingsPageNames) as CRSSettingsPages[]

  switch (currentPage) {
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
          onClickBack={() => {
            setCurrentPage(null)
          }}
        />
      )
    default:
      return (
        <div className={styles.container}>
          <ChildNavigation
            header={t('compliance_ready_software')}
            onClickBack={() => {
              setCurrentOption(null)
            }}
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
