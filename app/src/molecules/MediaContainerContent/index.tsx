import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'

import { Chip, StyledText } from '@opentrons/components'

import { Skeleton } from '/app/atoms/Skeleton'
import { cameraPhotoOpenAction } from '/app/redux/shell'

import styles from './media.module.css'

import type { ReactNode } from 'react'

export interface MediaContainerContentProps {
  mediaContent: ReactNode
  centerPrimaryText: string
  centerSecondaryText: string
  rightPrimaryText: string
  imagePath: string
  robotName: string | null
  state: 'loading' | 'error' | null
  overflowMenu: JSX.Element | null
  hoverText: string | null
  isCurrentCommandError: boolean | null
}

export function MediaContainerContent(
  props: MediaContainerContentProps
): JSX.Element {
  const {
    mediaContent,
    centerPrimaryText,
    centerSecondaryText,
    rightPrimaryText,
    state,
    robotName,
    overflowMenu,
    imagePath,
    isCurrentCommandError,
  } = props
  const { t } = useTranslation(['run_details', 'branded'])
  const dispatch = useDispatch()
  const isLoading = state === 'loading' || state === 'error'
  const onClick = (): void => {
    if (isLoading) return
    const img = new Image()
    img.src = imagePath
    img.onload = () => {
      if (robotName) {
        dispatch(
          cameraPhotoOpenAction({
            robotName: robotName,
            photoUrl: imagePath,
            windowTitle: t('branded:image_capture_window_title', {
              step: centerPrimaryText,
              rightPrimaryText,
            }),
          })
        )
      }
    }
  }

  return (
    <>
      <div className={styles.media_card}>
        <div
          className={styles.media_card_thumbnail}
          onClick={() => {
            if (isLoading) return
            onClick()
          }}
        >
          {isLoading ? (
            <Skeleton width="100%" height="100%" backgroundSize="47rem" />
          ) : (
            mediaContent
          )}

          {!isLoading && (
            <div className={styles.media_img_overlay}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={styles.media_overlay_text}
              >
                {t('view_image')}
              </StyledText>
            </div>
          )}
        </div>

        <div className={styles.media_card_cmd_txt_container}>
          {!isLoading && isCurrentCommandError ? (
            <Chip
              text={t('error_event')}
              type="error"
              width="fit-content"
              chipSize="small"
            />
          ) : null}
          {isLoading ? (
            <Skeleton width="100%" height="1.25rem" backgroundSize="47rem" />
          ) : (
            <StyledText desktopStyle="bodyDefaultRegular">
              {centerPrimaryText}
            </StyledText>
          )}
          {isLoading ? (
            <Skeleton width="80%" height="1rem" backgroundSize="47rem" />
          ) : (
            <StyledText
              desktopStyle="bodyDefaultRegular"
              className={styles.media_cmd_txt_subtext}
            >
              {centerSecondaryText}
            </StyledText>
          )}
        </div>

        <div className={styles.media_card_timestamp}>
          {isLoading ? (
            <Skeleton width="80%" height="1rem" backgroundSize="47rem" />
          ) : (
            <StyledText desktopStyle="bodyDefaultRegular">
              {rightPrimaryText}
            </StyledText>
          )}
        </div>
        {overflowMenu ?? null}
      </div>
    </>
  )
}
