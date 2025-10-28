import { useTranslation } from 'react-i18next'

import { ListTable, StyledText } from '@opentrons/components'

import { FloatingActionButton } from '/app/atoms/buttons'
// eslint-disable-next-line opentrons/no-imports-across-applications
import { useImageInfo } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera/ImageGalleryContainer/hooks/useImageInfo'
import { GalleryListItem } from '/app/organisms/ODD/RunningProtocol/ImageGalleryList/GalleryListItem'
import { ProtocolPlayPauseHeader } from '/app/organisms/ODD/RunningProtocol/shared/ProtocolPlayPauseHeader'

import styles from './gallery.module.css'

import type { RunStatus } from '@opentrons/api-client'
import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  RobotType,
} from '@opentrons/shared-data'
// eslint-disable-next-line opentrons/no-imports-across-applications
import type { UseImagesInfoItem } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera/ImageGalleryContainer/hooks/useImageInfo'

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

export function ImageGalleryList(props: ImageGalleryListProps): JSX.Element {
  const { t } = useTranslation('run_details')
  const { runId, protocolAnalysis, robotType, allRunDefs } = props

  const { items } = useImageInfo(runId)

  return (
    <div className={styles.container}>
      <ProtocolPlayPauseHeader {...props} />
      <div className={styles.gallery_list_container}>
        <GalleryListContent
          imagesInfo={items}
          protocolAnalysis={protocolAnalysis}
          runId={runId}
          robotType={robotType}
          allRunDefs={allRunDefs}
        />
      </div>
      <FloatingActionButton
        buttonText={t('image_capture')}
        iconName="photo-camera"
        onClick={() => null}
      />
    </div>
  )
}

interface GalleryListContentProps {
  imagesInfo: UseImagesInfoItem[]
  protocolAnalysis: any
  runId: string
  robotType: any
  allRunDefs: any
}

function GalleryListContent({
  imagesInfo,
  protocolAnalysis,
  runId,
  robotType,
  allRunDefs,
}: GalleryListContentProps): JSX.Element | null {
  return (
    <ListTable headers={[<GalleryTableHeaders key="1" />]}>
      {imagesInfo.map(item => (
        <GalleryListItem
          key={item.timestamp}
          {...item}
          protocolAnalysis={protocolAnalysis}
          runId={runId}
          robotType={robotType}
          allRunDefs={allRunDefs}
        />
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
