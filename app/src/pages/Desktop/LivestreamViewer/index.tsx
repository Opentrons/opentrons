import { useEffect, useLayoutEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'

import { useHlsVideo } from '/app/pages/Desktop/LivestreamViewer/hooks/useHlsVideo'
import { useNotifyRunQuery } from '/app/resources/runs'

import styles from './livestream.module.css'

export function LivestreamViewer(): JSX.Element {
  const { t } = useTranslation('branded')
  const { videoRef, videoError } = useHlsVideo()
  const [searchParams] = useSearchParams()
  const runId = searchParams.get('runId')
  const runStatus = useNotifyRunQuery(runId)?.data?.data.status ?? null

  useLayoutEffect(() => {
    document.title = t('livestream_window_title')
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.video_container}>
        {videoError != null ? (
          <div>{videoError}</div>
        ) : (
          <video ref={videoRef} autoPlay muted playsInline />
        )}
      </div>
    </div>
  )
}
