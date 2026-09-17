import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import clsx from 'clsx'

import { InfoScreen } from '@opentrons/components'

import styles from './photoviewer.module.css'

import type { ReactNode } from 'react'

export function CameraPhotoViewer(): ReactNode {
  const { t } = useTranslation('run_details')
  const [searchParams] = useSearchParams()
  const photoUrl = searchParams.get('photoUrl')
  const [isLoading, setIsLoading] = useState(true)

  const showLoadingScreen = isLoading || photoUrl == null

  const handleImageLoad = (): void => {
    setIsLoading(false)
  }

  const handleImageError = (): void => {
    setIsLoading(false)
  }

  return (
    <div className={styles.container}>
      {showLoadingScreen && (
        <InfoScreen content={t('image_loading')} iconName="ot-spinner" />
      )}
      <img
        className={clsx(
          styles.image,
          showLoadingScreen ? styles.image_inactive : styles.active
        )}
        src={photoUrl ?? ''}
        alt="camera-capture"
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  )
}
