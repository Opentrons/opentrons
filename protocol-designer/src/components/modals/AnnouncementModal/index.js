// @flow

import React, { useState } from 'react'
import cx from 'classnames'
import { Modal, OutlineButton } from '@opentrons/components'
import { i18n } from '../../../localization'
import { setLocalStorageItem, getLocalStorageItem } from '../../../persist'
import modalStyles from '../modal.css'
import { announcements } from './announcements'
import styles from './AnnouncementModal.css'

export const localStorageKey = 'announcementVersion'

export const AnnouncementModal = () => {
  const { version, message, heading, image } = announcements[
    announcements.length - 1
  ]

  const userHasNotSeenAnnouncement =
    getLocalStorageItem(localStorageKey) !== version

  const [showAnnouncementModal, setShowAnnouncementModal] = useState<boolean>(
    userHasNotSeenAnnouncement
  )

  const handleClick = () => {
    setLocalStorageItem(localStorageKey, version)
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

          <div className={styles.announcement_message}>
            <h3 className={styles.announcement_heading}>{heading}</h3>
            {message}
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
