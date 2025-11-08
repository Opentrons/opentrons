import { useTranslation } from 'react-i18next'

import { Chip, ListItem, StyledText } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { Skeleton } from '/app/atoms/Skeleton'
import { useCommandStepNumbers } from '/app/local-resources/commands/hooks/useCommandStepNumbers'
import { useImageGalleryData } from '/app/local-resources/images/hooks/useImageGalleryData'
import { handleCameraPhotoModal } from '/app/organisms/ODD/RunningProtocol/ImageGalleryList/CameraPhotoModal'
import { useImage } from '/app/resources/dataFiles/useImage'

import styles from './gallery.module.css'

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

export function GalleryListItem(props: GalleryListItemProps): JSX.Element {
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
    <ListItem type="default">
      <div className={styles.list_item_container}>
        <div className={styles.list_item_content_container}>
          <div>
            <StyledText oddStyle="bodyTextSemiBold">
              {item.timestamp}
            </StyledText>
          </div>
          <div className={styles.list_item_step}>
            {!isSkeleton && isCurrentCmdError && (
              <Chip
                text={t('error_event')}
                type="error"
                width="fit-content"
                chipSize="small"
              />
            )}
            {isSkeleton ? (
              <Skeleton width="100%" height="100%" backgroundSize="47rem" />
            ) : (
              <StyledText
                className={styles.list_item_step_text}
                oddStyle="bodyTextSemiBold"
              >
                {buildStepText()}
              </StyledText>
            )}
            {isSkeleton ? (
              <Skeleton width="100%" height="100%" backgroundSize="47rem" />
            ) : (
              <StyledText
                className={styles.list_item_step_text}
                oddStyle="bodyTextRegular"
              >
                {previousCommandString}
              </StyledText>
            )}
          </div>
          {!isSkeleton && (
            <SmallButton
              onClick={() => {
                handleCameraPhotoModal({
                  imagePath,
                  timestamp: item.timestamp,
                  stepCountStr: modalStepCountStr,
                })
              }}
              buttonText={t('view_image')}
              buttonType="secondary"
              buttonCategory="rounded"
            />
          )}
        </div>
      </div>
    </ListItem>
  )
}
