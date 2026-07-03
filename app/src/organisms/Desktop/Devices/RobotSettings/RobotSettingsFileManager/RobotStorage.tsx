import { useTranslation } from 'react-i18next'

import { StorageBar, StyledText } from '@opentrons/components'

import styles from './robotsettingsfilemanager.module.css'

export function RobotStorage(): JSX.Element {
  const { t } = useTranslation('device_details')
  return (
    <div className={styles.file_management_group}>
      <StyledText desktopStyle="bodyLargeSemiBold">
        {t('robot_storage')}
      </StyledText>
      {/* TODO: add logic for getting actual storage remaining on the robot */}
      <StorageBar percentUsed={33} label={t('file_capacity')} />
    </div>
  )
}
