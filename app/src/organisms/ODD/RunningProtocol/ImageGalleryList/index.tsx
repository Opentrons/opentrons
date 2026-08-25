import { useTranslation } from 'react-i18next'

import { ListTable, StyledText } from '@opentrons/components'

import { OddInfoScreen } from '/app/molecules/ODDInfoScreen'
import { GalleryListItem } from '/app/organisms/ODD/RunningProtocol/ImageGalleryList/GalleryListItem'
import { ProtocolPlayPauseHeader } from '/app/organisms/ODD/RunningProtocol/shared/ProtocolPlayPauseHeader'
import { useImageInfo } from '/app/resources/dataFiles/useImageInfo'

import styles from './gallery.module.css'

import type { ReactNode } from 'react'
import type { RunStatus } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  RobotType,
} from '@opentrons/shared-data'
import type { UseImagesInfoItem } from '/app/resources/dataFiles/useImageInfo'

export interface ImageGalleryListProps {
  runStatus: RunStatus | null
  onStop: () => void
  onTogglePlayPause: () => void
  protocolName: string | undefined
  runId: string
  protocolAnalysis: CompletedProtocolAnalysis | null
  robotType: RobotType
  allRunDefs: LabwareDefinition[]
}

export function ImageGalleryList(props: ImageGalleryListProps): ReactNode {
  const { runId, protocolAnalysis, robotType, allRunDefs } = props

  const { items } = useImageInfo(runId)

  return (
    <div className={styles.container}>
      <ProtocolPlayPauseHeader {...props} />
      <div className={styles.gallery_list_container}>
        {items.length > 0 ? (
          <GalleryListContent
            imagesInfo={items}
            protocolAnalysis={protocolAnalysis}
            runId={runId}
            robotType={robotType}
            allRunDefs={allRunDefs}
          />
        ) : (
          <NoImagesAvailable />
        )}
      </div>
    </div>
  )
}

function NoImagesAvailable(): ReactNode {
  const { t } = useTranslation('run_details')

  return (
    <OddInfoScreen
      type="neutral"
      header={t('no_images_available')}
      height="95%"
    />
  )
}

interface GalleryListContentProps {
  imagesInfo: UseImagesInfoItem[]
  protocolAnalysis: CompletedProtocolAnalysis | null
  runId: string
  robotType: RobotType
  allRunDefs: LabwareDefinition[]
}

function GalleryListContent({
  imagesInfo,
  protocolAnalysis,
  runId,
  robotType,
  allRunDefs,
}: GalleryListContentProps): ReactNode {
  return (
    <ListTable headers={[<GalleryTableHeaders key="1" />]}>
      {imagesInfo.map(item => (
        <GalleryListItem
          key={item.timestamp}
          item={item}
          protocolAnalysis={protocolAnalysis}
          runId={runId}
          robotType={robotType}
          allRunDefs={allRunDefs}
        />
      ))}
    </ListTable>
  )
}

function GalleryTableHeaders(): ReactNode {
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
