import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'

import {
  MenuItem,
  OverflowBtn,
  useMenuHandleClickOutside,
} from '@opentrons/components'

import styles from './gallery.module.css'

export interface GalleryItemOverflowMenuProps {
  imagePath: string | null
  commandStep: number | null
  imageTimestamp: string
  runTimestamp: string
  robotName: string
  protocolName: string
}

export function GalleryItemOverflowMenu({
  imagePath,
  commandStep,
  imageTimestamp,
  runTimestamp,
  robotName,
  protocolName,
}: GalleryItemOverflowMenuProps): JSX.Element {
  const { t } = useTranslation('run_details')
  const {
    menuOverlay,
    handleOverflowClick,
    showOverflowMenu,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()

  const onDownloadImage = (): void => {
    setShowOverflowMenu(false)
    const a = document.createElement('a')
    a.download = buildFileName()
    a.href = imagePath ?? ''
    a.click()

    a.remove()
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
        </div>
      )}
      {menuOverlay}
    </div>
  )
}
