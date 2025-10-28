import { useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

import { useHlsVideo } from '/app/pages/Desktop/LivestreamViewer/hooks/useHlsVideo'
import {
  LivestreamInfoScreen,
  useLivestreamInfoScreen,
} from '/app/pages/Desktop/LivestreamViewer/LivestreamInfoScreen'

import styles from './livestream.module.css'

export function LivestreamViewer(): JSX.Element {
  const { t } = useTranslation('branded')
  const { videoRef, videoError } = useHlsVideo()
  const [searchParams] = useSearchParams()
  const runId = searchParams.get('runId') ?? ''
  const infoScreenType = useLivestreamInfoScreen(runId, videoError)

  useLayoutEffect(() => {
    document.title = t('livestream_window_title')
  }, [])

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
      </div>
    </div>
  )
}
