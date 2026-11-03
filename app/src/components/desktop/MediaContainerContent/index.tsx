import { useTranslation } from 'react-i18next'

import {
  Chip,
  MenuItem,
  OverflowBtn,
  StyledText,
  useMenuHandleClickOutside,
} from '@opentrons/components'

import { Skeleton } from '/app/atoms/Skeleton'

import styles from './media.module.css'

import type { ReactNode } from 'react'

export interface OverflowAction {
  label: string
  onClick: () => void
}

export interface MediaContainerContentProps {
  mediaContent: ReactNode
  centerPrimaryText: string
  centerSecondaryText: string
  rightPrimaryText: string
  overflowMenu: boolean
  overflowMenuActions?: OverflowAction[]
  mediaContentOnClick?: () => void
  state: 'loading' | 'error' | null
  hoverText: string | null
}

export function MediaContainerContent(
  props: MediaContainerContentProps
): ReactNode {
  const {
    mediaContent,
    centerPrimaryText,
    centerSecondaryText,
    rightPrimaryText,
    state,
    hoverText,
    overflowMenu,
    overflowMenuActions,
    mediaContentOnClick,
  } = props

  const { t } = useTranslation(['run_details', 'branded'])
  const isLoading = state === 'loading'
  const isError = state === 'error'

  const {
    handleOverflowClick,
    showOverflowMenu,
    menuOverlay,
    setShowOverflowMenu,
  } = useMenuHandleClickOutside()

  return (
    <div className={styles.media_card}>
      <div
        className={styles.media_card_thumbnail}
        onClick={() => {
          if (!isLoading && mediaContentOnClick) mediaContentOnClick()
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
        {isError && (
          <Chip
            text={t('error_event')}
            type="error"
            width="fit-content"
            chipSize="small"
          />
        )}
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
      {overflowMenu && overflowMenuActions && (
        <div className={styles.overflow_container}>
          <OverflowBtn onClick={handleOverflowClick} />
          {showOverflowMenu && (
            <div className={styles.overflow_menu_container}>
              {overflowMenuActions.map(({ label, onClick }) => (
                <MenuItem
                  key={label}
                  onClick={() => {
                    onClick()
                    setShowOverflowMenu(false)
                  }}
                >
                  <div className={styles.overflow_menu_item}>{t(label)}</div>
                </MenuItem>
              ))}
            </div>
          )}
        </div>
      )}

      {menuOverlay}
    </div>
  )
}
