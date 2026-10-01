import { useTranslation } from 'react-i18next'

import { ChildNavigation } from '../../ChildNavigation'
import styles from './compliance_ready_settings.module.css'
import { ToggleSetting } from './ToggleSetting'

import type { ReactNode } from 'react'
import type { AuthSettingsData } from '@opentrons/api-client'

export function AdminActions({
  onClickBack,
  authSettings,
  patchAuthSettings,
}: {
  onClickBack: () => void
  authSettings?: AuthSettingsData
  patchAuthSettings: (authSettings: Partial<AuthSettingsData>) => void
}): ReactNode {
  const { t } = useTranslation('device_settings')
  return (
    <div className={styles.container}>
      <ChildNavigation
        header={t('odd_admin_title')}
        onClickBack={onClickBack}
      />
      <div className={styles.content}>
        <div className={styles.settings_list}>
          <ToggleSetting
            title={t('odd_require_admin_credentials_to_update_robots')}
            value={
              authSettings?.requireAdminCredsWhenUpdatingRobotSoftware ?? false
            }
            onClick={() => {
              patchAuthSettings({
                requireAdminCredsWhenUpdatingRobotSoftware:
                  !authSettings?.requireAdminCredsWhenUpdatingRobotSoftware,
              })
            }}
          />
          <ToggleSetting
            title={t('odd_require_admin_credentials_to_send_protocols')}
            value={
              authSettings?.requireAdminCredsWhenSendingProtocolToRobot ?? false
            }
            onClick={() => {
              patchAuthSettings({
                requireAdminCredsWhenSendingProtocolToRobot:
                  !authSettings?.requireAdminCredsWhenSendingProtocolToRobot,
              })
            }}
          />
          <ToggleSetting
            title={t(
              'odd_require_admin_credentials_to_sign_protocol_run_records'
            )}
            value={authSettings?.requireAdminCredsForSignoffProtocol ?? false}
            onClick={() => {
              patchAuthSettings({
                requireAdminCredsForSignoffProtocol:
                  !authSettings?.requireAdminCredsForSignoffProtocol,
              })
            }}
          />
        </div>
      </div>
    </div>
  )
}
