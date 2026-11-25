import { useTranslation } from 'react-i18next'

import { InfoScreen, ListTable, StyledText } from '@opentrons/components'

import { GalleryContainerOverflowMenu } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera/ImageGalleryContainer/GalleryContainerOverflowMenu'
import { useImageInfo } from '/app/resources/dataFiles/useImageInfo'

import styles from './gallery.module.css'
import { GalleryItemCard } from './GalleryItemCard'

import type { ReactNode } from 'react'
import type { RobotType } from '@opentrons/shared-data'
import type { UseImageGalleryDataProps } from '/app/local-resources/images/hooks/useImageGalleryData'
import type { GalleryContainerOverflowMenuProps } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera/ImageGalleryContainer/GalleryContainerOverflowMenu'

export function ImageGalleryContainer({
  runId,
  robotType,
  robotName,
  runTimestamp,
  protocolName,
}: {
  runId: string
  robotType: RobotType
  robotName: string
  runTimestamp: string
  protocolName: string
}): ReactNode {
  const { t } = useTranslation('run_details')
  const { items, protocolAnalysis, allRunDefs } = useImageInfo(runId)

  const imagesLength = items.length

  return (
    <div className={styles.gallery_container}>
      <GalleryHeader
        imagesCount={imagesLength}
        runId={runId}
        robotName={robotName}
        runTimestamp={runTimestamp}
        protocolName={protocolName}
      />
      {imagesLength > 0 ? (
        <ListTable headers={[<GalleryTableHeaders key="1" />]}>
          <div className={styles.gallery_content_wrapper}>
            {items.map(item => (
              <GalleryContent
                key={item.timestamp}
                item={item}
                protocolAnalysis={protocolAnalysis}
                runId={runId}
                robotType={robotType}
                robotName={robotName}
                runTimestamp={runTimestamp}
                allRunDefs={allRunDefs}
                protocolName={protocolName}
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

interface GalleryHeaderProps extends GalleryContainerOverflowMenuProps {
  imagesCount: number
}

function GalleryHeader({
  imagesCount,
  ...rest
}: GalleryHeaderProps): ReactNode {
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
      <GalleryContainerOverflowMenu {...rest} />
    </div>
  )
}

interface GalleryContentProps extends UseImageGalleryDataProps {
  runTimestamp: string
  robotName: string
  protocolName: string
}

function GalleryContent(props: GalleryContentProps): ReactNode {
  return (
    <div className={styles.gallery_content_container}>
      <GalleryItemCard {...props} />
    </div>
  )
}

function GalleryTableHeaders(): ReactNode {
  const { t } = useTranslation('run_details')

  return (
    <div className={styles.gallery_table_headers_container}>
      <StyledText
        desktopStyle="captionSemiBold"
        className={styles.header_thumbnail}
      >
        {t('thumbnail')}
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
