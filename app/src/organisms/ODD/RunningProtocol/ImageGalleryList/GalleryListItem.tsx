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

// eslint-disable-next-line opentrons/no-imports-across-applications
import type { UseImagesInfoItem } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera/ImageGalleryContainer/hooks/useImageInfo'

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
  const { currentCommandString: stepCommandText, previousCommandString } =
    useImageAndCommand({
      item: { imageId, stepCommandId, previousStepCommandId, timestamp },
      protocolAnalysis,
      runId,
      robotType,
      allRunDefs,
    })

  return (
    <ListItem type="default">
      <div className={styles.list_item_container}>
        <div className={styles.list_item_content_container}>
          <div>
            <StyledText oddStyle="bodyTextSemiBold">{timestamp}</StyledText>
          </div>
          <div className={styles.list_item_step}>
            <StyledText
              className={styles.list_item_step_text}
              oddStyle="bodyTextSemiBold"
            >
              {stepCommandText}
            </StyledText>
            <StyledText
              className={styles.list_item_step_text}
              oddStyle="bodyTextRegular"
            >
              {previousCommandString}
            </StyledText>
          </div>
          <SmallButton
            onClick={() => {
              imagePath
                ? handleCameraPhotoModal({
                    imagePath,
                    timestamp,
                    stepCommandText,
                  })
                : Skeleton({
                    width: '45.625rem',
                    height: 'max-content',
                    backgroundSize: 'small',
                  })
            }}
            buttonText={t('view_image')}
            buttonType="secondary"
            buttonCategory="rounded"
          />
        </div>
      </div>
    </ListItem>
  )
}
