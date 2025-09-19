import { useTranslation } from 'react-i18next'

import { ListTable, StyledText } from '@opentrons/components'

import { FloatingActionButton } from '/app/atoms/buttons'
// eslint-disable-next-line opentrons/no-imports-across-applications
import { useStubImagesInfo } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera/ImageGalleryContainer/hooks/useStubImagesInfo'
import { GalleryListItem } from '/app/organisms/ODD/RunningProtocol/ImageGalleryList/GalleryListItem'
import { ProtocolPlayPauseHeader } from '/app/organisms/ODD/RunningProtocol/shared/ProtocolPlayPauseHeader'

import styles from './gallery.module.css'

import type { RunStatus } from '@opentrons/api-client'
// eslint-disable-next-line opentrons/no-imports-across-applications
import type { UseStubImagesInfoResult } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera/ImageGalleryContainer/hooks/useStubImagesInfo'

export interface ImageGalleryListProps {
  runStatus: RunStatus | null
  onStop: () => void
  onTogglePlayPause: () => void
  protocolName: string | undefined
}

export function ImageGalleryList(props: ImageGalleryListProps): JSX.Element {
  const { t } = useTranslation('run_details')

  const imagesInfo = useStubImagesInfo()

  return (
    <div className={styles.container}>
      <ProtocolPlayPauseHeader {...props} />
      <div className={styles.gallery_list_container}>
        <GalleryListContent imagesInfo={imagesInfo} />
      </div>
      <FloatingActionButton
        buttonText={t('image_capture')}
        iconName="photo-camera"
        onClick={() => null}
      />
    </div>
  )
}

function GalleryListContent({
  imagesInfo,
}: {
  imagesInfo: UseStubImagesInfoResult[]
}): JSX.Element {
  return (
    <ListTable headers={[<GalleryTableHeaders key="1" />]}>
      {imagesInfo.map(imgInfo => (
        <GalleryListItem key={imgInfo.timestamp} {...imgInfo} />
      ))}
    </ListTable>
  )
}

function GalleryTableHeaders(): JSX.Element {
  const { t } = useTranslation('run_details')

  return (
    <div className={styles.gallery_table_headers_container}>
      <StyledText
        oddStyle="bodyTextSemiBold"
        className={styles.header_timestamp}
      >
        {t('timestamp')}
      </StyledText>
      <StyledText
        oddStyle="bodyTextSemiBold"
        className={styles.header_step_details}
      >
        {t('step_detail')}
      </StyledText>
    </div>
  )
}
