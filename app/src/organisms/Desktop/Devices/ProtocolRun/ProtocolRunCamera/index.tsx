import { useTranslation } from 'react-i18next'

import { Chip, Flex, SPACING, StyledText } from '@opentrons/components'

import { Divider } from '/app/atoms/structure'
import { isTerminalRunStatus } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunHeader/utils'
import { useCameraUsageSettings } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/hooks/useCameraUsageSettings'

import { ImageGalleryContainer } from './ImageGalleryContainer'
import { LaunchLivestreamBtn } from './LaunchLivestreamBtn'
import styles from './runcamera.module.css'

import type { RunStatus } from '@opentrons/api-client'

export interface ProtocolRunCameraProps {
  runStatus: RunStatus | null
  runId: string
}

export function ProtocolRunCamera({
  runStatus,
  runId,
}: ProtocolRunCameraProps): JSX.Element {
  const { t } = useTranslation('run_details')
  const { isCameraEnabled } = useCameraUsageSettings()

  return (
    <div className={styles.content_container}>
      <div className={styles.header_container}>
        <div className={styles.camera_status}>
          <Flex gridGap={SPACING.spacing10}>
            <StyledText desktopStyle="bodyLargeSemiBold">
              {t('camera')}
            </StyledText>
            {!isTerminalRunStatus(runStatus) && (
              <Chip
                text={isCameraEnabled ? t('enabled') : t('disabled')}
                type={isCameraEnabled ? 'success' : 'neutral'}
                iconName="connection-status"
              />
            )}
          </Flex>
        </div>
        {!isTerminalRunStatus(runStatus) && isCameraEnabled ? (
          <LaunchLivestreamBtn runId={runId} />
        ) : null}
      </div>
      <Divider width="100%" />
      <ImageGalleryContainer />
    </div>
  )
}
