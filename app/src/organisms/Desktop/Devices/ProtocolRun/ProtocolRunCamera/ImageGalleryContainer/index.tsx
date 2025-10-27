import { useTranslation } from 'react-i18next'

import { InfoScreen, ListTable, StyledText } from '@opentrons/components'

import { useCameraUsageSettings } from '/app/organisms/Desktop/Devices/RobotSettings/RobotSettingsCamera/hooks/useCameraUsageSettings'

import styles from './gallery.module.css'
import { GalleryItemCard } from './GalleryItemCard'
import { useImageInfo } from './hooks/useImageInfo'

import type { RobotType } from '@opentrons/shared-data'
import type { GalleryItemCardProps } from './GalleryItemCard'

export function ImageGalleryContainer({
  run_id,
  robotType,
}: {
  run_id: string
  robotType: RobotType
}): JSX.Element {
  const { t } = useTranslation('run_details')
  const { items, protocolAnalysis, allRunDefs } = useImageInfo(run_id)

  const imagesLength = items.length
  const { isCameraEnabled } = useCameraUsageSettings()

  return (
    <div className={styles.gallery_container}>
      <GalleryHeader imagesCount={imagesLength} />
      {isCameraEnabled && imagesLength > 0 ? (
        <ListTable headers={[<GalleryTableHeaders key="1" />]}>
          <div className={styles.gallery_content_wrapper}>
            {items.map(item => (
              <GalleryContent
                key={item.timestamp}
                item={item}
                protocolAnalysis={protocolAnalysis}
                runId={run_id}
                robotType={robotType}
                allRunDefs={allRunDefs}
              />
            ))}
          </div>
        </ListTable>
      ) : (
        <InfoScreen content={t('no_images_available')} />
      )}
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

function GalleryContent(props: GalleryItemCardProps): JSX.Element {
  return (
    <div className={styles.gallery_content_container}>
      <GalleryItemCard {...props} />
    </div>
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
