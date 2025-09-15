import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import styles from './photoviewer.module.css'

export function CameraPhotoViewer(): JSX.Element {
  const [searchParams] = useSearchParams()
  const photoUrl = searchParams.get('photoUrl')
  // TODO(jh, 09-10-25): Handle loading state once designs are finalized.
  const [, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
  }, [photoUrl])

  const handleImageLoad = (): void => {
    setIsLoading(false)
  }

  const handleImageError = (): void => {
    setIsLoading(false)
  }

  return (
    <div className={styles.container}>
      {photoUrl != null && (
        <img
          className={styles.image}
          src={photoUrl}
          alt="camera-capture"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      )}
    </div>
  )
}
