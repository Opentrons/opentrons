import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'

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
  commandStep: number | null
  imageTimestamp: string
  runTimestamp: string
  robotName: string
  protocolName: string
}

export function GalleryItemOverflowMenu({
  runId,
  currentCommand,
  imagePath,
  commandStep,
  imageTimestamp,
  runTimestamp,
  robotName,
  protocolName,
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
    a.download = buildFileName()
    a.href = imagePath ?? ''
    a.click()

    a.remove()
  }

  const toggleErrorModal = (): void => {
    setShowOverflowMenu(false)
    setShowErrorModal(!showErrorModal)
  }

  const formattedRunTs = format(new Date(runTimestamp), 'M/d/yy_HH:mm:ss')
  const formattedImgTs = format(new Date(imageTimestamp), 'M/d/yy_HH:mm:ss')

  const buildFileName = (): string =>
    `${robotName}_${protocolName}_${formattedRunTs}_${commandStep}_${formattedImgTs}.jpeg`

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
