import { useTranslation } from 'react-i18next'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { OddModal } from '/app/molecules/OddModal'
import styles from '/app/organisms/ODD/RunningProtocol/ImageGalleryList/gallery.module.css'

import type { ReactNode } from 'react'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

export interface CameraPhotoModalProps {
  imagePath: string
  stepCountStr: string
  timestamp: string
}

export const handleCameraPhotoModal = (
  props: CameraPhotoModalProps
): Promise<unknown> => NiceModal.show(CameraPhotoModal, { ...props })

const CameraPhotoModal = NiceModal.create(
  ({
    imagePath,
    stepCountStr,
    timestamp,
  }: CameraPhotoModalProps): ReactNode => {
    const { t } = useTranslation('run_details')
    const modal = useModal()

    const onClick = (): void => {
      modal.remove()
    }

    const headerProps: OddModalHeaderBaseProps = {
      title: t('image_at_step_at_timestamp', {
        step: stepCountStr,
        timestamp,
      }),
      onClick,
      hasExitIcon: true,
    }

    return (
      <OddModal
        header={headerProps}
        onOutsideClick={onClick}
        className={styles.modal_content}
      >
        <img src={imagePath} alt="camera-capture" />
      </OddModal>
    )
  }
)
