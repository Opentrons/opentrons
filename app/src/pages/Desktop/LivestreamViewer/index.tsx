import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

import { Chip } from '@opentrons/components'
// eslint-disable-next-line no-restricted-imports
import { useRunQuery } from '@opentrons/react-api-client'

import { useHlsVideo } from '/app/pages/Desktop/LivestreamViewer/hooks/useHlsVideo'
import {
  LivestreamInfoScreen,
  useLivestreamInfoScreen,
} from '/app/pages/Desktop/LivestreamViewer/LivestreamInfoScreen'

import styles from './livestream.module.css'

const RUN_POLLING_INTERVAL_MS = 5000

export function LivestreamViewer(): JSX.Element {
  const [searchParams] = useSearchParams()
  const runId = searchParams.get('runId') ?? ''
  // TODO(jh, 11-04-25): Notifications are not working in secondary windows. Investigate further.
  const { data: runData, isLoading: isRunLoading } = useRunQuery(runId, {
    refetchInterval: RUN_POLLING_INTERVAL_MS,
  })
  const runStatus = runData?.data.status ?? null
  const { videoRef, videoError } = useHlsVideo(runStatus)
  const infoScreenType = useLivestreamInfoScreen(
    runStatus,
    isRunLoading,
    videoError
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
