import { useTranslation } from 'react-i18next'

import { Chip, Flex, SPACING, StyledText } from '@opentrons/components'

import { Divider } from '/app/atoms/structure'
import { useCameraUsageSettings } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/hooks/useCameraUsageSettings'

import { ImageGalleryContainer } from './ImageGalleryContainer'
import { LaunchLivestreamBtn } from './LaunchLivestreamBtn'
import styles from './runcamera.module.css'

import type { RobotType } from '@opentrons/shared-data'

export interface ProtocolRunCameraProps {
  runId: string
  robotType: RobotType
}

export function ProtocolRunCamera(props: ProtocolRunCameraProps): JSX.Element {
  const { t } = useTranslation('run_details')
  const { runId, robotType } = props
  const { isCameraEnabled } = useCameraUsageSettings()
  return (
    <div className={styles.content_container}>
      <div className={styles.header_container}>
        <div className={styles.camera_status}>
          <Flex gridGap={SPACING.spacing10}>
            <StyledText desktopStyle="bodyLargeSemiBold">
              {t('camera')}
            </StyledText>
            <Chip
              text={isCameraEnabled ? t('enabled') : t('Disabled')}
              type={isCameraEnabled ? 'success' : 'neutral'}
              iconName="connection-status"
            />
          </Flex>
        </div>
        {isCameraEnabled ? <LaunchLivestreamBtn /> : null}
      </div>
      <Divider width="100%" />
      <ImageGalleryContainer runId={runId} robotType={robotType} />
    </div>
  )
}
