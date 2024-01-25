import * as React from 'react'
import cx from 'classnames'
import { useTranslation } from 'react-i18next'
import { Modal, OutlineButton } from '@opentrons/components'
import {
  setLocalStorageItem,
  getLocalStorageItem,
  localStorageAnnouncementKey,
} from '../../../persist'
import { getAnnouncements } from './announcements'
import modalStyles from '../modal.css'
import styles from './AnnouncementModal.css'

export const AnnouncementModal = (): JSX.Element => {
  const { t } = useTranslation(['modal', 'button'])
  const announcements = getAnnouncements({ t })

  const { announcementKey, message, heading, image } = announcements[
    announcements.length - 1
  ]

  const userHasNotSeenAnnouncement =
    getLocalStorageItem(localStorageAnnouncementKey) !== announcementKey

  const [
    showAnnouncementModal,
    setShowAnnouncementModal,
  ] = React.useState<boolean>(userHasNotSeenAnnouncement)

  const handleClick = (): void => {
    setLocalStorageItem(localStorageAnnouncementKey, announcementKey)
    setShowAnnouncementModal(false)
  }

  return (
    <>
      {showAnnouncementModal && (
        <Modal
          className={cx(modalStyles.modal, styles.announcement_modal)}
          contentsClassName={styles.modal_contents}
          onCloseClick={handleClick}
        >
          {image && (
            <>
              {image}
              <hr className={styles.separator} />
            </>
          )}

          <div className={styles.announcement_body}>
            <h3 className={styles.announcement_heading}>{heading}</h3>
            <div className={styles.announcement_message}>{message}</div>

            <div className={modalStyles.button_row}>
              <OutlineButton onClick={handleClick}>
                {t('button:got_it')}
              </OutlineButton>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
