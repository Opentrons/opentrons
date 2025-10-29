import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

import { Chip } from '@opentrons/components'

import { useHlsVideo } from '/app/pages/Desktop/LivestreamViewer/hooks/useHlsVideo'
import {
  LivestreamInfoScreen,
  useLivestreamInfoScreen,
} from '/app/pages/Desktop/LivestreamViewer/LivestreamInfoScreen'

import styles from './livestream.module.css'

export function LivestreamViewer(): JSX.Element {
  const { videoRef, videoError } = useHlsVideo()
  const [searchParams] = useSearchParams()
  const runId = searchParams.get('runId') ?? ''
  const infoScreenType = useLivestreamInfoScreen(runId, videoError)

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
