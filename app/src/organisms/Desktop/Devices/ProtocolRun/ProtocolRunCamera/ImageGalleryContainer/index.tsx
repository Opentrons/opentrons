import { useTranslation } from 'react-i18next'

import { ListTable, StyledText } from '@opentrons/components'

import styles from './gallery.module.css'
import { GalleryItemCard } from './GalleryItemCard'
import { useStubImagesInfo } from './hooks/useStubImagesInfo'

import type { UseStubImagesInfoResult } from './hooks/useStubImagesInfo'

export function ImageGalleryContainer(): JSX.Element {
  const imagesInfo = useStubImagesInfo()

  return (
    <div className={styles.gallery_container}>
      <GalleryHeader imagesCount={imagesInfo.length} />
      <GalleryContent imagesInfo={imagesInfo} />
    </div>
  )
}

function GalleryHeader({ imagesCount }: { imagesCount: number }): JSX.Element {
  const { t } = useTranslation('run_details')

  return (
    <div className={styles.gallery_header_container}>
      <div className={styles.gallery_header_title}>
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('image_gallery')}
        </StyledText>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          className={styles.num_photos_text}
        >
          {t('num_photos', { count: imagesCount })}
        </StyledText>
      </div>
      <StyledText desktopStyle="bodyDefaultRegular">
        {t('protocol_images_viewable')}
      </StyledText>
    </div>
  )
}

function GalleryContent({
  imagesInfo,
}: {
  imagesInfo: UseStubImagesInfoResult[]
}): JSX.Element {
  return (
    <ListTable headers={[<GalleryTableHeaders key="1" />]}>
      <div className={styles.gallery_content_container}>
        {imagesInfo.map(imgInfo => (
          <GalleryItemCard key={imgInfo.timestamp} {...imgInfo} />
        ))}
      </div>
    </ListTable>
  )
}

function GalleryTableHeaders(): JSX.Element {
  const { t } = useTranslation('run_details')

  return (
    <div className={styles.gallery_table_headers_container}>
      <StyledText
        desktopStyle="captionSemiBold"
        className={styles.header_thumbnail}
      >
        {t('Thumbnail')}
      </StyledText>
      <StyledText
        desktopStyle="captionSemiBold"
        className={styles.header_step_details}
      >
        {t('step_detail')}
      </StyledText>
      <StyledText
        desktopStyle="captionSemiBold"
        className={styles.header_timestamp}
      >
        {t('timestamp')}
      </StyledText>
    </div>
  )
}
