import { useTranslation } from 'react-i18next'

import { useCommandStepNumbers } from '/app/local-resources/commands/hooks/useCommandStepNumbers'
import { useImageGalleryData } from '/app/local-resources/images/hooks/useImageGalleryData'
import { ODDMediaContainerContent } from '/app/molecules/ODDMediaContainerContent'
import { handleCameraPhotoModal } from '/app/organisms/ODD/RunningProtocol/ImageGalleryList/CameraPhotoModal'
import { useImage } from '/app/resources/dataFiles/useImage'

import type { ReactNode } from 'react'
import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  RobotType,
} from '@opentrons/shared-data'
import type { UseImagesInfoItem } from '/app/resources/dataFiles/useImageInfo'

export interface GalleryListItemProps {
  protocolAnalysis: CompletedProtocolAnalysis | null
  runId: string
  robotType: RobotType
  allRunDefs: LabwareDefinition[]
  item: UseImagesInfoItem
}

export function GalleryListItem(props: GalleryListItemProps): ReactNode {
  const { t } = useTranslation('run_details')
  const { item, runId, protocolAnalysis, robotType, allRunDefs } = props

  const imagePath = useImage(item.imageId)
  const { previousCommandString, isLoading, currentCommand } =
    useImageGalleryData({
      item,
      protocolAnalysis,
      runId,
      robotType,
      allRunDefs,
    })
  const isSkeleton = imagePath == null || isLoading
  const isCurrentCmdError = currentCommand?.error != null

  const state = (): 'loading' | 'error' | null => {
    if (isSkeleton) {
      return 'loading'
    } else if (isCurrentCmdError) {
      return 'error'
    } else {
      return null
    }
  }

  const { commandStep, totalSteps } = useCommandStepNumbers({
    currentCommand,
    protocolAnalysis,
  })

  const buildStepText = (): string => {
    const totalStepStr =
      commandStep === null || totalSteps === null ? '?' : totalSteps.toString()

    return t('step_current_total', {
      current: commandStep ?? '?',
      total: totalStepStr,
    })
  }
  const modalStepCountStr = buildStepText().toLowerCase()
  return (
    <ODDMediaContainerContent
      leftPrimaryText={item.timestamp}
      centerPrimaryText={currentCommand?.commandType ?? ''}
      centerSecondaryText={previousCommandString}
      rightButtonOnClick={() => {
        handleCameraPhotoModal({
          imagePath: imagePath ?? '',
          timestamp: item.timestamp,
          stepCountStr: modalStepCountStr,
        })
      }}
      rightButtonText={t('view_image')}
      state={state()}
    />
  )
}
