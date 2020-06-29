// @flow

import { Modal, OutlineButton } from '@opentrons/components'
import cx from 'classnames'
import * as React from 'react'

import { i18n } from '../../../localization'
import {
  getLocalStorageItem,
  localStorageAnnouncementKey,
  setLocalStorageItem,
} from '../../../persist'
import modalStyles from '../modal.css'
import styles from './AnnouncementModal.css'
import { announcements } from './announcements'

export const AnnouncementModal = (): React.Node => {
  const { announcementKey, message, heading, image } = announcements[
    announcements.length - 1
  ]

  const userHasNotSeenAnnouncement =
    getLocalStorageItem(localStorageAnnouncementKey) !== announcementKey

  const [
    showAnnouncementModal,
    setShowAnnouncementModal,
  ] = React.useState<boolean>(userHasNotSeenAnnouncement)

  const handleClick = () => {
    setLocalStorageItem(localStorageAnnouncementKey, announcementKey)
    setShowAnnouncementModal(false)
  }

  return (
    <>
      {showAnnouncementModal && (
        <Modal
          className={cx(modalStyles.modal, styles.announcement_modal)}
          contentsClassName={styles.modal_contents}
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
                {i18n.t('button.got_it')}
              </OutlineButton>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
