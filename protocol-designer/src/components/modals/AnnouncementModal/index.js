// @flow

import React, { useState } from 'react'
import cx from 'classnames'
import { Modal, OutlineButton } from '@opentrons/components'
import { i18n } from '../../../localization'
import { setLocalStorageItem, getLocalStorageItem } from '../../../persist'
import modalStyles from '../modal.css'
import { announcements } from './announcements'
import styles from './AnnouncementModal.css'

export const localStorageKey = 'announcementKey'

export const AnnouncementModal = () => {
  const { announcementKey, message, heading, image } = announcements[
    announcements.length - 1
  ]

  const userHasNotSeenAnnouncement =
    getLocalStorageItem(localStorageKey) !== announcementKey

  const [showAnnouncementModal, setShowAnnouncementModal] = useState<boolean>(
    userHasNotSeenAnnouncement
  )

  const handleClick = () => {
    setLocalStorageItem(localStorageKey, announcementKey)
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
