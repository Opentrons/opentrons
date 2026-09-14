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
import {
  SOURCE_RUN_RECORD,
  useCameraAnalytics,
} from '/app/redux-resources/analytics/'
import { useRobotType } from '/app/redux-resources/robots'

import styles from './gallery.module.css'

import type { ReactNode } from 'react'

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
}: GalleryContainerOverflowMenuProps): ReactNode {
  const { t } = useTranslation('run_details')
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()
  const [isPendingDownload, setIsPendingDownload] = useState(false)
  const { data: imagesZipFile, isLoading } = useAllRunImagesRaw(runId)

  const robotType = useRobotType(robotName)

  const { reportPhotoAccessUsage } = useCameraAnalytics({
    source: SOURCE_RUN_RECORD,
    robotType,
  })
  const formattedRunTs = (() => {
    try {
      if (runTimestamp == null) return ''
      return format(new Date(runTimestamp), 'yyyyMMdd-HHmmss')
    } catch (error) {
      console.warn('Invalid timestamp:', runTimestamp)
      return ''
    }
  })()
  const buildImagesZipName = (): string =>
    `${robotName}_${protocolName}_${formattedRunTs}.zip`

  const onDownloadZip = (): void => {
    setShowOverflowMenu(false)

    if (imagesZipFile != null) {
      downloadFile(imagesZipFile, buildImagesZipName())
    } else {
      setIsPendingDownload(true)
    }
    reportPhotoAccessUsage({
      action: 'downloadZip',
    })
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
