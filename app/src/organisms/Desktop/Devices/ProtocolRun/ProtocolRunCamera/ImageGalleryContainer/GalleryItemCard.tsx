import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { useMenuHandleClickOutside } from '@opentrons/components'

import { useCommandStepNumbers } from '/app/local-resources/commands/hooks/useCommandStepNumbers'
import { useImageGalleryData } from '/app/local-resources/images/hooks/useImageGalleryData'
import { MediaContainerContent } from '/app/molecules/MediaContainerContent'
import {
  SOURCE_RUN_RECORD,
  useCameraAnalytics,
} from '/app/redux-resources/analytics/'
import { useRobotType } from '/app/redux-resources/robots'
import { cameraPhotoOpenAction } from '/app/redux/shell'
import { useImage } from '/app/resources/dataFiles/useImage'

import styles from './gallery.module.css'
import { GalleryItemErrorModal } from './GalleryItemErrorModal'

import type { ReactNode } from 'react'
import type { UseImageGalleryDataProps } from '/app/local-resources/images/hooks/useImageGalleryData'

export interface GalleryItemCardProps extends UseImageGalleryDataProps {
  protocolName: string
  runTimestamp: string
  robotName: string
}

export function GalleryItemCard(props: GalleryItemCardProps): ReactNode {
  const { item, protocolAnalysis, robotName, runId } = props
  const {
    currentCommand,
    currentCommandString,
    previousCommandString,
    isLoading,
  } = useImageGalleryData(props)

  const { setShowOverflowMenu } = useMenuHandleClickOutside()
  const robotType = useRobotType(robotName)

  const { reportPhotoAccessUsage } = useCameraAnalytics({
    source: SOURCE_RUN_RECORD,
    robotType,
  })
  const onDownloadImage = (): void => {
    setShowOverflowMenu(false)
    const a = document.createElement('a')
    a.download = item.filename
    a.href = imagePath ?? ''
    a.click()
    reportPhotoAccessUsage({
      action: 'download',
    })
    a.remove()
  }
  const imagePath = useImage(item.imageId)
  const timestamp = item.timestamp
  const { commandStep, totalSteps } = useCommandStepNumbers({
    currentCommand,
    protocolAnalysis,
  })

  const { t } = useTranslation(['run_details', 'branded'])

  const buildStepText = (): string => {
    const totalStepStr =
      commandStep === null || totalSteps === null ? '?' : totalSteps.toString()

    return t('step_current_total', {
      current: commandStep ?? '?',
      total: totalStepStr,
    })
  }
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
  const stepCommandText = t('step_command', {
    step: buildStepText(),
    command: currentCommandString,
  })

  const dispatch = useDispatch()
  const onClick = (): void => {
    if (isLoading) {
      return
    }
    if (robotName && imagePath != null) {
      dispatch(
        cameraPhotoOpenAction({
          robotName: robotName,
          photoUrl: imagePath,
          windowTitle: t('branded:image_capture_window_title', {
            step: stepCommandText,
            timestamp,
          }),
        })
      )
    }
  }
  const [showErrorModal, setShowErrorModal] = useState(false)

  const toggleErrorModal = (): void => {
    setShowOverflowMenu(false)
    setShowErrorModal(!showErrorModal)
  }
  const actions = [{ label: t('download_image'), onClick: onDownloadImage }]
  if (isCurrentCmdError) {
    actions.push({ label: t('view_error_details'), onClick: toggleErrorModal })
  }
  return (
    <>
      {state() === 'error' && showErrorModal && currentCommand != null && (
        <GalleryItemErrorModal
          erroredCommand={currentCommand}
          runId={runId}
          toggleModal={toggleErrorModal}
          robotName={robotName}
        />
      )}
      <MediaContainerContent
        mediaContent={
          <img
            className={styles.gallery_img}
            src={imagePath ?? undefined}
            alt="camera-photo"
          />
        }
        centerPrimaryText={stepCommandText}
        centerSecondaryText={previousCommandString}
        rightPrimaryText={timestamp}
        state={state()}
        overflowMenu={true}
        overflowMenuActions={actions}
        hoverText={t('view_image')}
        mediaContentOnClick={onClick}
      />
    </>
  )
}
