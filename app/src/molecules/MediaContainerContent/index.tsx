import { useTranslation } from 'react-i18next'

import { Chip, StyledText } from '@opentrons/components'

import { Skeleton } from '/app/atoms/Skeleton'

import styles from './media.module.css'

import type { ReactNode } from 'react'

export interface MediaContainerContentProps {
  mediaContent: ReactNode
  centerPrimaryText: string
  centerSecondaryText: string
  rightPrimaryText: string
  onClick?: () => void
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
    hoverText,
    overflowMenu,
    onClick,
    isCurrentCommandError,
  } = props
  const { t } = useTranslation(['run_details', 'branded'])
  const isLoading = state === 'loading'
  return (
    <>
      <div className={styles.media_card}>
        <div
          className={styles.media_card_thumbnail}
          onClick={() => {
            if (isLoading || !onClick) {
              return
            }
            onClick()
          }}
        >
          {isLoading ? (
            <Skeleton width="100%" height="100%" backgroundSize="47rem" />
          ) : (
            mediaContent
          )}

          {!isLoading && hoverText != null && (
            <div className={styles.media_img_overlay}>
              <StyledText
                desktopStyle="bodyDefaultRegular"
                className={styles.media_overlay_text}
              >
                {hoverText}
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
        {overflowMenu}
      </div>
    </>
  )
}
