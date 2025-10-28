import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { COLORS, StyledText, useCommandTextString } from '@opentrons/components'
import {
  useCommandQuery,
  useDataFileRawQuery,
  useHost,
} from '@opentrons/react-api-client'

import { Skeleton } from '/app/atoms/Skeleton'
import { cameraPhotoOpenAction } from '/app/redux/shell'

import styles from './gallery.module.css'

import type {
  CompletedProtocolAnalysis,
  LabwareDefinition,
  ProtocolAnalysisOutput,
  RobotType,
} from '@opentrons/shared-data'
import type { UseImagesInfoItem } from './hooks/useImageInfo'

const PHOTO_VIEWER_PADDING_PX = 16 * 2

interface UseImageAndCommandResult {
  currentCommandString: string
  previousCommandString: string
  stubStepFraction: string
  isLoading: boolean
}
export function useImage(imageId: string = 'stubId'): string | null {
  useDataFileRawQuery(imageId)
  const imagePath = null
  return imagePath
}

export function useImageAndCommand({
  item,
  protocolAnalysis,
  runId,
  robotType,
  allRunDefs,
}: GalleryItemCardProps): UseImageAndCommandResult {
  const { stepCommandId, previousStepCommandId } = item

  const { data: currentCommandDetails, isLoading: currentLoading } =
    useCommandQuery(runId, stepCommandId)
  const { data: previousCommandDetails, isLoading: previousLoading } =
    useCommandQuery(runId, previousStepCommandId)

  const currentCommand = currentCommandDetails?.data
  const previousCommand = previousCommandDetails?.data

  const currentCommandString = useCommandTextString({
    command: currentCommand ?? null,
    allRunDefs,
    commandTextData: protocolAnalysis,
    robotType,
  })

  const previousCommandString = useCommandTextString({
    command: previousCommand ?? null,
    allRunDefs,
    commandTextData: protocolAnalysis,
    robotType,
  })

  const stubTotalSteps = '100'
  const stubCurrentStep = '1'
  const stubStepFraction = `${stubCurrentStep}/${stubTotalSteps}`
  const isLoading = currentLoading || previousLoading

  return {
    currentCommandString:
      currentCommandString.commandText.length === 0
        ? '?'
        : currentCommandString.commandText,
    previousCommandString:
      previousCommandString.commandText.length === 0
        ? '?'
        : previousCommandString.commandText,
    stubStepFraction,
    isLoading,
  }
}

export interface GalleryItemCardProps {
  item: UseImagesInfoItem
  protocolAnalysis: CompletedProtocolAnalysis | ProtocolAnalysisOutput | null
  runId: string
  robotType: RobotType
  allRunDefs: LabwareDefinition[]
}

export function GalleryItemCard(
  props: GalleryItemCardProps
): JSX.Element | null {
  const { item } = props
  const {
    currentCommandString,
    previousCommandString,
    stubStepFraction,
    isLoading,
  } = useImageAndCommand(props)

  const imagePath = useImage(item.imageId)
  const timestamp = item.timestamp

  const { t } = useTranslation('run_details')
  const dispatch = useDispatch()
  const host = useHost()

  const isSkeleton = imagePath == null || isLoading

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
            windowTitle: t('image_capture_window_title', {
              step: 'Step 1 / 999999',
              timestamp,
            }),
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
        {isSkeleton ? (
          <Skeleton width="100%" height="1.25rem" backgroundSize="47rem" />
        ) : (
          <StyledText desktopStyle="bodyDefaultRegular" color={COLORS.black90}>
            {`Step ${stubStepFraction}: ${currentCommandString}`}
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
      {isSkeleton ? (
        <Skeleton width="18%" height="1rem" backgroundSize="47rem" />
      ) : (
        <div className={styles.gallery_card_timestamp}>
          <StyledText desktopStyle="bodyDefaultRegular">{timestamp}</StyledText>
        </div>
      )}
    </div>
  )
}
