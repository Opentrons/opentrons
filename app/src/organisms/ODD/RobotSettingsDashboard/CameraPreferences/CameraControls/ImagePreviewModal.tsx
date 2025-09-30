import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

import { getTopPortalEl } from '/app/App/portal'
import { OddModal } from '/app/molecules/OddModal'

import styles from './cameracontrols.module.css'

import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

export interface ImagePreviewModalProps {
  imgPath: string
  toggleModal: () => void
}

export function ImagePreviewModal({
  imgPath,
  toggleModal,
}: ImagePreviewModalProps): JSX.Element {
  const { t } = useTranslation('device_settings')

  const modalHeader: OddModalHeaderBaseProps = useMemo(
    () => ({
      title: t('image_preview_timestamp', { timestamp: Math.random() }),
      hasExitIcon: true,
      onClick: toggleModal,
    }),
    []
  )

  return createPortal(
    <OddModal header={modalHeader} onOutsideClick={toggleModal}>
      <div className={styles.image_container}>
        <img className={styles.image} src={imgPath} alt="camera-capture" />
      </div>
    </OddModal>,
    getTopPortalEl()
  )
}
