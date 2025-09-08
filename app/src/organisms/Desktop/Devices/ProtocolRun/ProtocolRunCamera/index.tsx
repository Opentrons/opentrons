import { useTranslation } from 'react-i18next'

import { Chip, StyledText } from '@opentrons/components'

import { LaunchLivestreamBtn } from './LaunchLivestreamBtn'
import styles from './runcamera.module.css'

export function ProtocolRunCamera(): JSX.Element {
  const { t } = useTranslation('run_details')

  return (
    <div className={styles.content_container}>
      <div className={styles.header_container}>
        <div className={styles.camera_status}>
          <StyledText desktopStyle="bodyLargeSemiBold">
            {t('camera')}
          </StyledText>
          <Chip
            text={t('enabled')}
            type="success"
            iconName="connection-status"
          />
        </div>
        <LaunchLivestreamBtn />
      </div>
    </div>
  )
}
