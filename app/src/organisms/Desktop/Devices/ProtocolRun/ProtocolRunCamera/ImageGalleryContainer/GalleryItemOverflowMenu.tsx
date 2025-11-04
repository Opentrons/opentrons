import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  MenuItem,
  OverflowBtn,
  useMenuHandleClickOutside,
} from '@opentrons/components'

import { GalleryItemErrorModal } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera/ImageGalleryContainer/GalleryItemErrorModal'

import styles from './gallery.module.css'

import type { RunTimeCommand } from '@opentrons/shared-data'

export interface GalleryItemOverflowMenuProps {
  runId: string
  currentCommand: RunTimeCommand | null
  imagePath: string | null
  imageFilename: string
  robotName: string
}

export function GalleryItemOverflowMenu({
  runId,
  currentCommand,
  imagePath,
  imageFilename,
  robotName,
}: GalleryItemOverflowMenuProps): JSX.Element {
  const { t } = useTranslation('run_details')

  const [showErrorModal, setShowErrorModal] = useState(false)
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()

  const isErroredCommand = currentCommand?.error != null

  const onDownloadImage = (): void => {
    setShowOverflowMenu(false)
    const a = document.createElement('a')
    a.download = imageFilename
    a.href = imagePath ?? ''
    a.click()

    a.remove()
  }

  const toggleErrorModal = (): void => {
    setShowOverflowMenu(false)
    setShowErrorModal(!showErrorModal)
  }

  return (
    <div className={styles.overflow_container}>
      <OverflowBtn onClick={handleOverflowClick} />
      {showOverflowMenu && (
        <div className={styles.overflow_menu_container}>
          <MenuItem onClick={onDownloadImage}>{t('download_image')}</MenuItem>
          {isErroredCommand && (
            <MenuItem onClick={toggleErrorModal}>
              {t('view_error_details')}
            </MenuItem>
          )}
        </div>
      )}
      {menuOverlay}
      {isErroredCommand && showErrorModal && (
        <GalleryItemErrorModal
          erroredCommand={currentCommand}
          runId={runId}
          robotName={robotName}
          toggleModal={toggleErrorModal}
        />
      )}
    </div>
  )
}
