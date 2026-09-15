import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Icon, ListButton, StyledText } from '@opentrons/components'
import {
  useAuditSettingsQuery,
  useAuthSettingsQuery,
  useGetRobotServerAccessControlSettingsQuery,
} from '@opentrons/react-api-client'

import { ChildNavigation } from '/app/organisms/ODD/ChildNavigation'

import styles from './compliance_ready_settings.module.css'
import { LoginSettings } from './LoginSettings'
import { SettingsListButton } from './SettingsListButton'

import type { ReactNode } from 'react'
import type { SetSettingOption } from '../types'
import type { CRSSettingsPages } from './types'

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
  const [currentPage, setCurrentPage] = useState<CRSSettingsPages | null>(null)

  const settingsPageNames: { [key in CRSSettingsPages]: string } = {
    users: t('users_title'),
    login: t('login_title'),
    admin: t('admin_title'),
    protocols: t('protocols_title'),
    audit: t('audit_title'),
  }

  const pages = Object.keys(settingsPageNames) as CRSSettingsPages[]

  if (currentPage === 'login') {
    return (
      <LoginSettings
        authSettings={authSettings?.data}
        onClickBack={() => {
          setCurrentPage(null)
        }}
      />
    )
  }
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
