import { useTranslation } from 'react-i18next'

import { ListItem, StyledText } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { Skeleton } from '/app/atoms/Skeleton'
// eslint-disable-next-line opentrons/no-imports-across-applications
import {
  useImage,
  useImageAndCommand,
} from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera/ImageGalleryContainer/GalleryItemCard'
import { handleCameraPhotoModal } from '/app/organisms/ODD/RunningProtocol/ImageGalleryList/CameraPhotoModal'

import styles from './gallery.module.css'

import type { UseImagesInfoItem } from '/app/resources/dataFiles/useImageInfo'

export interface GalleryListItemProps extends UseImagesInfoItem {
  protocolAnalysis: any
  runId: string
  robotType: any
  allRunDefs: any
}

export function GalleryListItem(props: GalleryListItemProps): JSX.Element {
  const { t } = useTranslation('run_details')
  const {
    timestamp,
    imageId,
    stepCommandId,
    previousStepCommandId,
    runId,
    protocolAnalysis,
    robotType,
    allRunDefs,
  } = props

  const imagePath = useImage(imageId)
  const {
    currentCommandString: stepCommandText,
    previousCommandString,
    isLoading,
  } = useImageAndCommand({
    item: { imageId, stepCommandId, previousStepCommandId, timestamp },
    protocolAnalysis,
    runId,
    robotType,
    allRunDefs,
  })
  const isSkeleton = imagePath == null || isLoading

  return (
    <ListItem type="default">
      <div className={styles.list_item_container}>
        <div className={styles.list_item_content_container}>
          <div>
            <StyledText oddStyle="bodyTextSemiBold">{timestamp}</StyledText>
          </div>
          <div className={styles.list_item_step}>
            {isSkeleton ? (
              <Skeleton width="100%" height="100%" backgroundSize="47rem" />
            ) : (
              <StyledText
                className={styles.list_item_step_text}
                oddStyle="bodyTextSemiBold"
              >
                {stepCommandText}
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
                  timestamp,
                  stepCommandText,
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
