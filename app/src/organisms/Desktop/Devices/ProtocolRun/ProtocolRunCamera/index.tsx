import { useTranslation } from 'react-i18next'

import { Chip, Flex, SPACING, StyledText } from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'
import { OT2_ROBOT_TYPE } from '@opentrons/shared-data'

import { Divider } from '/app/atoms/structure'
import { isTerminalRunStatus } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunHeader/utils'
import { useCameraUsageSettings } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/hooks/useCameraUsageSettings'
import { OPENTRONS_USB } from '/app/redux/discovery'

import { ImageGalleryContainer } from './ImageGalleryContainer'
import { LaunchLivestreamBtn } from './LaunchLivestreamBtn'
import styles from './runcamera.module.css'

import type { RunStatus } from '@opentrons/api-client'
import type { RobotType } from '@opentrons/shared-data'

export interface ProtocolRunCameraProps {
  runId: string
  runStatus: RunStatus | null
  robotType: RobotType
  robotName: string
  runTimestamp: string
  protocolName: string
}

export function ProtocolRunCamera({
  runStatus,
  runId,
  robotType,
  robotName,
  runTimestamp,
  protocolName,
}: ProtocolRunCameraProps): JSX.Element {
  const { t } = useTranslation('run_details')
  const host = useHost()
  const { isCameraEnabled } = useCameraUsageSettings()

  const showLivestreamBtn =
    host?.hostname !== OPENTRONS_USB && robotType !== OT2_ROBOT_TYPE

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
                chipSize="small"
              />
            )}
          </Flex>
        </div>
        {!isTerminalRunStatus(runStatus) &&
        isCameraEnabled &&
        showLivestreamBtn ? (
          <LaunchLivestreamBtn runId={runId} />
        ) : null}
      </div>
      <Divider width="100%" />
      <ImageGalleryContainer
        runId={runId}
        robotType={robotType}
        runTimestamp={runTimestamp}
        robotName={robotName}
        protocolName={protocolName}
      />
    </div>
  )
}
