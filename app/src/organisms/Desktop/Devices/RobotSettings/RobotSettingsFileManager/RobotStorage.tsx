import { useTranslation } from 'react-i18next'

import { StorageBar, StyledText } from '@opentrons/components'
import { useHealth } from '@opentrons/react-api-client'

import styles from './robotsettingsfilemanager.module.css'

import type { ReactNode } from 'react'

export function RobotStorage(): ReactNode {
  const { t } = useTranslation('device_details')
  const health = useHealth()

  const totalMb = health?.disk_details?.systemTotalMb ?? 0
  const availableMb = health?.disk_details?.systemAvailableMb ?? 0
  const percentUsed =
    totalMb > 0 ? Math.round(((totalMb - availableMb) / totalMb) * 100) : 0

  return (
    <div className={styles.file_management_group}>
      <StyledText desktopStyle="bodyLargeSemiBold">
        {t('robot_storage')}
      </StyledText>
      <StorageBar percentUsed={percentUsed} label={t('file_capacity')} />
    </div>
  )
}
