import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { StyledText } from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { cameraPhotoOpenAction } from '/app/redux/shell'

import styles from './gallery.module.css'

import type { UseStubImagesInfoResult } from './hooks/useStubImagesInfo'

const PHOTO_VIEWER_PADDING_PX = 16 * 2

export function GalleryItemCard({
  imagePath,
  stepCommandText,
  previousStepCommandText,
  timestamp,
}: UseStubImagesInfoResult): JSX.Element {
  const { t } = useTranslation('run_details')
  const dispatch = useDispatch()
  const host = useHost()

  const onClick = (): void => {
    const img = new Image()
    img.src = imagePath
    // Supply the shell with actual dimensions of the photo, so the new window
    // is sized properly.
    img.onload = () => {
      if (host?.robotName) {
        dispatch(
          cameraPhotoOpenAction({
            robotName: host.robotName,
            photoUrl: imagePath,
            windowTitle: t('image_capture_window_title', {
              step: 'Step 1 / 999999',
              timestamp,
            }),
            // Passing magic numbers for dimensions is unideal,
            // but post initial rendering resize() techniques are even clunkier.
            dimensions: {
              width: img.naturalWidth + PHOTO_VIEWER_PADDING_PX,
              height: img.naturalHeight + PHOTO_VIEWER_PADDING_PX,
            },
          })
        )
      }
    }
  }

  return (
    <div className={styles.gallery_card}>
      <div
        className={styles.gallery_card_thumbnail}
        onClick={onClick}
        role="button"
      >
        <img
          className={styles.gallery_img}
          src={imagePath}
          alt="camera-photo"
        />
        <div className={styles.gallery_img_overlay}>
          <StyledText
            desktopStyle="bodyDefaultRegular"
            className={styles.gallery_overlay_text}
          >
            {t('view_image')}
          </StyledText>
        </div>
      </div>
      <div className={styles.gallery_card_cmd_txt_container}>
        <StyledText desktopStyle="bodyDefaultRegular">
          {stepCommandText}
        </StyledText>
        <StyledText
          desktopStyle="bodyDefaultRegular"
          className={styles.gallery_cmd_txt_subtext}
        >
          {previousStepCommandText}
        </StyledText>
      </div>
      <div className={styles.gallery_card_timestamp}>
        <StyledText desktopStyle="bodyDefaultRegular">{timestamp}</StyledText>
      </div>
    </div>
  )
}
