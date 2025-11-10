import { ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { COLORS, Modal, StyledText } from '@opentrons/components'

import { Skeleton } from '/app/atoms/Skeleton'

import styles from './gallery.module.css'

export interface MediaContainerContentProps {
  mediaContent: ReactNode
  centerPrimaryText: string
  centerSecondaryText: string
  rightPrimaryText: string
  state: 'loading' | 'error'
  overflowMenu: JSX.Element | null
  hoverText: string | null
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
    overflowMenu,
  } = props
  const { t } = useTranslation(['run_details', 'branded'])
  const [showModal, setShowModal] = useState(false)

  const onClick = (): void => {
    if (state === 'loading' || state === 'error') return
    setShowModal(true)
  }

  return (
    <>
      <div className={styles.gallery_card}>
        <div
          className={styles.gallery_card_thumbnail}
          onClick={state ? undefined : onClick}
          role={state ? undefined : 'button'}
          style={state ? { cursor: 'default' } : undefined}
        >
          {state ? (
            <Skeleton width="100%" height="100%" backgroundSize="47rem" />
          ) : (
            mediaContent
          )}

          {!state && (
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
          {state ? (
            <Skeleton width="100%" height="1.25rem" backgroundSize="47rem" />
          ) : (
            <StyledText
              desktopStyle="bodyDefaultRegular"
              color={COLORS.black90}
            >
              {centerPrimaryText}
            </StyledText>
          )}

          {state ? (
            <Skeleton width="80%" height="1rem" backgroundSize="47rem" />
          ) : (
            <StyledText
              desktopStyle="bodyDefaultRegular"
              className={styles.gallery_cmd_txt_subtext}
              color={COLORS.grey60}
            >
              {centerSecondaryText}
            </StyledText>
          )}
        </div>

        <div className={styles.gallery_card_timestamp}>
          {state ? (
            <Skeleton width="80%" height="1rem" backgroundSize="47rem" />
          ) : (
            <StyledText desktopStyle="bodyDefaultRegular">
              {rightPrimaryText}
            </StyledText>
          )}
        </div>
        {overflowMenu ?? null}
      </div>

      {showModal && (
        <Modal
          title={t('branded:image_capture_window_title', { rightPrimaryText })}
          onClose={() => setShowModal(false)}
        >
          <div className={styles.modal_image_container}>{mediaContent}</div>
        </Modal>
      )}
    </>
  )
}
