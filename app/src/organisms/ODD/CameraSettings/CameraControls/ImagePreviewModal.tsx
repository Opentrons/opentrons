import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'

import { getTopPortalEl } from '/app/App/portal'
import { OddModal } from '/app/molecules/OddModal'

import styles from './cameracontrols.module.css'

import type { ReactNode } from 'react'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

export interface ImagePreviewModalProps {
  imgPath: string
  toggleModal: () => void
}

export function ImagePreviewModal({
  imgPath,
  toggleModal,
}: ImagePreviewModalProps): ReactNode {
  const { t } = useTranslation('device_settings')

  const displayTimestamp = useMemo(() => {
    return format(new Date(), 'M/d/yy HH:mm:ss')
  }, [])

  const modalHeader: OddModalHeaderBaseProps = useMemo(
    () => ({
      title: t('image_preview_timestamp', { timestamp: displayTimestamp }),
      hasExitIcon: true,
      onClick: toggleModal,
    }),
    // FIXME(2026-03-03): Supply all missing dependencies, if it's safe. If it's unsafe, explain why.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
