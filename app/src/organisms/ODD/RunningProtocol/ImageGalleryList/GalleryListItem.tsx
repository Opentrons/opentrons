import { useTranslation } from 'react-i18next'

import { ListItem, StyledText } from '@opentrons/components'

import { SmallButton } from '/app/atoms/buttons'
import { handleCameraPhotoModal } from '/app/organisms/ODD/RunningProtocol/ImageGalleryList/CameraPhotoModal'

import styles from './gallery.module.css'

// eslint-disable-next-line opentrons/no-imports-across-applications
import type { UseStubImagesInfoResult } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera/ImageGalleryContainer/hooks/useStubImagesInfo'

export function GalleryListItem({
  imagePath,
  stepCommandText,
  previousStepCommandText,
  timestamp,
}: UseStubImagesInfoResult): JSX.Element {
  const { t } = useTranslation('run_details')

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
              {previousStepCommandText}
            </StyledText>
          </div>
          <SmallButton
            onClick={() => {
              void handleCameraPhotoModal({
                imagePath,
                timestamp,
                stepCommandText,
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
