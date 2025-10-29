import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { Chip, COLORS, StyledText } from '@opentrons/components'
import { useHost } from '@opentrons/react-api-client'

import { Skeleton } from '/app/atoms/Skeleton'
import { useCommandStepNumbers } from '/app/local-resources/commands/hooks/useCommandStepNumbers'
import { useImageGalleryData } from '/app/local-resources/images/hooks/useImageGalleryData'
import { cameraPhotoOpenAction } from '/app/redux/shell'
import { useImage } from '/app/resources/dataFiles/useImage'

import styles from './gallery.module.css'

import type { UseImageGalleryDataProps } from '/app/local-resources/images/hooks/useImageGalleryData'

export function GalleryItemCard(props: UseImageGalleryDataProps): JSX.Element {
  const { item, protocolAnalysis } = props
  const {
    currentCommand,
    currentCommandString,
    previousCommandString,
    isLoading,
  } = useImageGalleryData(props)

  const imagePath = useImage(item.imageId)
  const timestamp = item.timestamp
  const isCurrentCmdError = currentCommand?.error != null
  const { commandStep, totalSteps } = useCommandStepNumbers({
    currentCommand,
    protocolAnalysis,
  })

  const { t } = useTranslation(['run_details', 'branded'])
  const dispatch = useDispatch()
  const host = useHost()

  const isSkeleton = imagePath == null || isLoading

  const buildStepText = (): string => {
    const totalStepStr =
      commandStep === null || totalSteps === null ? '?' : totalSteps.toString()

    return t('step_current_total', {
      current: commandStep ?? '?',
      total: totalStepStr,
    })
  }

  const onClick = (): void => {
    if (isSkeleton || imagePath == null) return
    const img = new Image()
    img.src = imagePath
    img.onload = () => {
      if (host?.robotName) {
        dispatch(
          cameraPhotoOpenAction({
            robotName: host.robotName,
            photoUrl: imagePath,
            windowTitle: t('branded:image_capture_window_title', {
              step: buildStepText(),
              timestamp,
            }),
          })
        )
      }
    }
  }

  return (
    <div className={styles.gallery_card}>
      <div
        className={styles.gallery_card_thumbnail}
        onClick={isSkeleton ? undefined : onClick}
        role={isSkeleton ? undefined : 'button'}
        style={isSkeleton ? { cursor: 'default' } : undefined}
      >
        {isSkeleton ? (
          <Skeleton width="100%" height="100%" backgroundSize="47rem" />
        ) : (
          <img
            className={styles.gallery_img}
            src={imagePath}
            alt="camera-photo"
          />
        )}

        {!isSkeleton && (
          <div className={styles.gallery_img_overlay}>
            <StyledText
              desktopStyle="bodyDefaultRegular"
              className={styles.gallery_overlay_text}
            >
              {t('view_image')}
            </StyledText>
          </div>
        )}
      </div>

      <div className={styles.gallery_card_cmd_txt_container}>
        {!isSkeleton && isCurrentCmdError && (
          <Chip
            text={t('error_event')}
            type="error"
            width="fit-content"
            chipSize="small"
          />
        )}
        {isSkeleton ? (
          <Skeleton width="100%" height="1.25rem" backgroundSize="47rem" />
        ) : (
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.black90}>
            {t('step_command', {
              step: buildStepText(),
              command: currentCommandString,
            })}
          </StyledText>
        )}

        {isSkeleton ? (
          <Skeleton width="80%" height="1rem" backgroundSize="47rem" />
        ) : (
          <StyledText
            desktopStyle="bodyDefaultRegular"
            className={styles.gallery_cmd_txt_subtext}
            color={COLORS.grey60}
          >
            {previousCommandString}
          </StyledText>
        )}
      </div>
      <div className={styles.gallery_card_timestamp}>
        {isSkeleton ? (
          <Skeleton width="80%" height="1rem" backgroundSize="47rem" />
        ) : (
          <StyledText desktopStyle="bodyDefaultRegular">{timestamp}</StyledText>
        )}
      </div>
    </div>
  )
}
