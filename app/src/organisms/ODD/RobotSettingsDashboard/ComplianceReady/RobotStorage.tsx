import { useTranslation } from 'react-i18next'

import { ChildNavigation } from '../../ChildNavigation'
import styles from './compliance_ready_settings.module.css'
import { ToggleSetting } from './ToggleSetting'

import type { ReactNode } from 'react'
import type { RobotServerAccessControlSettingsData } from '@opentrons/api-client'

export function RobotStorage({
  robotServerSettings,
  patchRobotServerSettings,
  onClickBack,
}: {
  robotServerSettings?: RobotServerAccessControlSettingsData
  patchRobotServerSettings: (
    data: Partial<RobotServerAccessControlSettingsData>
  ) => void
  onClickBack: () => void
}): ReactNode {
  const { t } = useTranslation('device_settings')
  return (
    <div className={styles.container}>
      <ChildNavigation
        header={t('odd_storage_title')}
        onClickBack={onClickBack}
      />
      <div className={styles.content}>
        <div className={styles.settings_list}>
          <ToggleSetting
            title={t('odd_automatically_delete_protocol_run_logs')}
            value={robotServerSettings?.deleteOverMaxOnDiskProtocols ?? false}
            onClick={() => {
              patchRobotServerSettings({
                deleteOverMaxOnDiskProtocols:
                  !robotServerSettings?.deleteOverMaxOnDiskProtocols,
              })
            }}
          />
        </div>
      </div>
    </div>
  )
}
