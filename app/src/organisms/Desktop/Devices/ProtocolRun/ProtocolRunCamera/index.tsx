import { useTranslation } from 'react-i18next'

import { Chip, StyledText } from '@opentrons/components'

import { Divider } from '/app/atoms/structure'
import { useCameraUsageSettings } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/hooks/useCameraUsageSettings'

import { ImageGalleryContainer } from './ImageGalleryContainer'
import { LaunchLivestreamBtn } from './LaunchLivestreamBtn'
import styles from './runcamera.module.css'

export function ProtocolRunCamera(): JSX.Element {
  const { t } = useTranslation('run_details')
  const { isCameraEnabled } = useCameraUsageSettings()
  return (
    <div className={styles.content_container}>
      <div className={styles.header_container}>
        <div className={styles.camera_status}>
          <StyledText desktopStyle="bodyLargeSemiBold">
            {t('camera')}
          </StyledText>
          <Chip
            text={isCameraEnabled ? t('enabled') : t('Disabled')}
            type={isCameraEnabled ? 'success' : 'neutral'}
            iconName="connection-status"
          />
        </div>
        {isCameraEnabled ? <LaunchLivestreamBtn /> : null}
      </div>
      {isCameraEnabled ? <Divider width="100%" /> : null}
      {isCameraEnabled ? <ImageGalleryContainer /> : null}
    </div>
  )
}
