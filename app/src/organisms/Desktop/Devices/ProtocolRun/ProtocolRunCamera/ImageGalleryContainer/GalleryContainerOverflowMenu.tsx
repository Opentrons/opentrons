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
import { useHost } from '@opentrons/react-api-client'

import { isFileSaveCanceledError } from '/app/local-resources/files/fileSaveCanceledError'
import {
  SOURCE_RUN_RECORD,
  useCameraAnalytics,
} from '/app/redux-resources/analytics/'
import { useRobotType } from '/app/redux-resources/robots'
import { saveFileFromUrl } from '/app/redux/shell/remote'

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
  const [isDownloading, setIsDownloading] = useState(false)
  const host = useHost()

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
    reportPhotoAccessUsage({
      action: 'downloadZip',
    })
    if (host == null || isDownloading) {
      return
    }

    setIsDownloading(true)
    void saveFileFromUrl({
      name: buildImagesZipName(),
      source: `/dataFiles/${runId}/images/download`,
      hostname: host.hostname,
      port: host.port ?? null,
    })
      .catch((error: unknown) => {
        if (!isFileSaveCanceledError(error)) {
          throw error
        }
      })
      .finally(() => {
        setIsDownloading(false)
      })
  }

  return (
    <div className={styles.images_container_overflow_container}>
      <OverflowBtn onClick={handleOverflowClick} />
      {showOverflowMenu && (
        <div className={styles.overflow_menu_container}>
          <MenuItem onClick={onDownloadZip}>
            <div className={styles.overflow_menu_item}>
              {t('download_images')}
              {isDownloading && (
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
