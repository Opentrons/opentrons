import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { useCommandStepNumbers } from '/app/local-resources/commands/hooks/useCommandStepNumbers'
import { useImageGalleryData } from '/app/local-resources/images/hooks/useImageGalleryData'
import { MediaContainerContent } from '/app/molecules/MediaContainerContent'
import { GalleryItemOverflowMenu } from '/app/organisms/Desktop/Devices/ProtocolRun/ProtocolRunCamera/ImageGalleryContainer/GalleryItemOverflowMenu'
import { cameraPhotoOpenAction } from '/app/redux/shell'
import { useImage } from '/app/resources/dataFiles/useImage'

import styles from './gallery.module.css'

import type { UseImageGalleryDataProps } from '/app/local-resources/images/hooks/useImageGalleryData'

export interface GalleryItemCardProps extends UseImageGalleryDataProps {
  protocolName: string
  runTimestamp: string
  robotName: string
}

export function GalleryItemCard(props: GalleryItemCardProps): JSX.Element {
  const { item, protocolAnalysis, runId, robotName } = props
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
  const isSkeleton = imagePath == null || isLoading

  const buildStepText = (): string => {
    const totalStepStr =
      commandStep === null || totalSteps === null ? '?' : totalSteps.toString()

    return t('step_current_total', {
      current: commandStep ?? '?',
      total: totalStepStr,
    })
  }
  const state = isSkeleton ? 'loading' : null
  const centerPrimaryText = t('step_command', {
    step: buildStepText(),
    command: currentCommandString,
  })

  const dispatch = useDispatch()
  const onClick = (): void => {
    if (isLoading) return
    const img = new Image()
    const imagePathUrl = img.src
    img.onload = () => {
      if (robotName) {
        dispatch(
          cameraPhotoOpenAction({
            robotName: robotName,
            photoUrl: imagePathUrl,
            windowTitle: t('branded:image_capture_window_title', {
              step: centerPrimaryText,
              timestamp,
            }),
          })
        )
      }
    }
  }

  return (
    <MediaContainerContent
      mediaContent={
        <img
          className={styles.gallery_img}
          src={imagePath ?? undefined}
          alt="camera-photo"
        />
      }
      centerPrimaryText={centerPrimaryText}
      centerSecondaryText={previousCommandString}
      rightPrimaryText={timestamp}
      state={state}
      overflowMenu={
        <GalleryItemOverflowMenu
          runId={runId}
          currentCommand={currentCommand}
          imagePath={imagePath}
          imageFilename={item.filename}
          robotName={robotName}
        />
      }
      hoverText={t('view_image')}
      onClick={onClick}
      isCurrentCommandError={isCurrentCmdError}
    />
  )
}
