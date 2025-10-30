import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'

import {
  COLORS,
  Icon,
  MenuItem,
  OverflowBtn,
  SIZE_1,
  useMenuHandleClickOutside,
} from '@opentrons/components'
import { useAllRunImagesRaw } from '@opentrons/react-api-client'

import { downloadFile } from '/app/organisms/Desktop/Devices/utils'

import styles from './gallery.module.css'

export interface GalleryContainerOverflowMenuProps {
  runId: string
  protocolName: string
  runTimestamp: string
  robotName: string
}

export function GalleryContainerOverflowMenu({
  runId,
  robotName,
  protocolName,
  runTimestamp,
}: GalleryContainerOverflowMenuProps): JSX.Element {
  const { t } = useTranslation('run_details')
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const [isPendingDownload, setIsPendingDownload] = useState(false)
  const { data: imagesZipFile, isLoading } = useAllRunImagesRaw(runId)

  const formattedRunTs = format(new Date(runTimestamp), 'M/d/yy_HH:mm:ss')
  const buildImagesZipName = (): string =>
    `${robotName}_${protocolName}_${formattedRunTs}_${t('images')}.zip`

  const onDownloadZip = (): void => {
    setShowOverflowMenu(false)

    if (imagesZipFile != null) {
      downloadFile(imagesZipFile, buildImagesZipName())
    } else {
      setIsPendingDownload(true)
    }
  }

  if (imagesZipFile != null && isPendingDownload) {
    setIsPendingDownload(false)
    downloadFile(imagesZipFile, buildImagesZipName())
  }
  return (
    <div className={styles.images_container_overflow_container}>
      <OverflowBtn onClick={handleOverflowClick} />
      {showOverflowMenu && (
        <div className={styles.overflow_menu_container}>
          <MenuItem onClick={onDownloadZip}>
            <div className={styles.overflow_menu_item}>
              {t('download_images')}
              {isPendingDownload && isLoading && (
                <Icon
                  name="ot-spinner"
                  size={SIZE_1}
                  color={COLORS.grey50}
                  aria-label="spinner"
                  spin
                />
              )}
            </div>
          </MenuItem>
        </div>
      )}
      {menuOverlay}
    </div>
  )
}
