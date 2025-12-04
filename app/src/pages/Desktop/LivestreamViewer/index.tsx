import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  Btn,
  Chip,
  COLORS,
  Flex,
  Icon,
  StyledText,
} from '@opentrons/components'

import { useHlsVideo } from '/app/pages/Desktop/LivestreamViewer/hooks/useHlsVideo'
import { useReportWindowDurationEvent } from '/app/pages/Desktop/LivestreamViewer/hooks/useReportWindowDurationEvent'
import {
  LivestreamInfoScreen,
  useLivestreamInfoScreen,
} from '/app/pages/Desktop/LivestreamViewer/LivestreamInfoScreen'
import { useCurrentRunId, useNotifyRunQuery } from '/app/resources/runs'

import styles from './livestream.module.css'

const RUN_POLLING_INTERVAL_MS = 5000

export function LivestreamViewer(): JSX.Element {
  // We make UI affordances when a run has ended, even if it is un-currented.
  // The livestream viewer makes the assumption that it will not *initially* render
  // for a run that is already historical.
  const { t } = useTranslation('run_details')

  const [retainedRunId, setRetainedRunId] = useState<string | null>(null)
  const currentRunId = useCurrentRunId({
    refetchInterval: RUN_POLLING_INTERVAL_MS,
  })

  if (currentRunId != null && currentRunId !== retainedRunId) {
    setRetainedRunId(currentRunId)
  }

  const { data: runData, isLoading: isRunLoading } = useNotifyRunQuery(
    retainedRunId,
    {
      refetchInterval: RUN_POLLING_INTERVAL_MS,
    }
  )
  const isCurrentRunLoading = retainedRunId == null || isRunLoading
  const runStatus = runData?.data.status ?? null
  const cameraData = runData?.data.cameraSettings ?? null
  const { videoRef, videoError } = useHlsVideo(runStatus, cameraData)
  const infoScreenType = useLivestreamInfoScreen(
    runStatus,
    cameraData,
    isCurrentRunLoading,
    videoError
  )

  useReportWindowDurationEvent(
    retainedRunId,
    runStatus,
    cameraData?.liveStreamEnabled ?? false
  )

  return (
    <div className={styles.container}>
      <div className={styles.video_container}>
        {infoScreenType != null && (
          <LivestreamInfoScreen type={infoScreenType} />
        )}
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={
            infoScreenType != null ? styles.video_inactive : styles.video_active
          }
        />
        {infoScreenType == null && (
          <div className={styles.chip_overlay}>
            <LiveVideoChip />
          </div>
        )}
      </div>
      {infoScreenType == null && (
        <Btn
          className={styles.capture_image_button}
          backgroundColor={COLORS.blue50}
        >
          <Flex className={styles.capture_image_button_text}>
            <Icon name="camera" size="1rem" color={COLORS.white} />
            <StyledText color={COLORS.white} desktopStyle="bodyDefaultSemiBold">
              {t('capture_image')}{' '}
            </StyledText>
          </Flex>
        </Btn>
      )}
    </div>
  )
}

function LiveVideoChip(): JSX.Element {
  const { t } = useTranslation('run_details')

  return (
    <Chip
      type="success"
      text={t('live_video')}
      chipSize="small"
      hasIcon={true}
      iconName="connection-status"
    />
  )
}
