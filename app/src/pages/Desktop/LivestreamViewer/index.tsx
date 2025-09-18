import { useHlsVideo } from '/app/pages/Desktop/LivestreamViewer/hooks/useHlsVideo'

import styles from './livestream.module.css'

export function LivestreamViewer(): JSX.Element {
  const { videoRef, videoError } = useHlsVideo()

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
