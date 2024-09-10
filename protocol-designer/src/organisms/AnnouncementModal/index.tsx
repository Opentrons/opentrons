import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_CENTER,
  JUSTIFY_END,
  Modal,
  PrimaryButton,
  SPACING,
} from '@opentrons/components'
import {
  setLocalStorageItem,
  getLocalStorageItem,
  localStorageAnnouncementKey,
} from '../../persist'
import { useAnnouncements } from './announcements'

export const AnnouncementModal = (): JSX.Element => {
  const { t } = useTranslation(['modal', 'button'])
  const announcements = useAnnouncements()

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
          title={heading}
          type="info"
          onClose={handleClick}
          footer={
            <Flex justifyContent={JUSTIFY_END} padding={SPACING.spacing24}>
              <PrimaryButton onClick={handleClick}>
                {t('button:got_it')}
              </PrimaryButton>
            </Flex>
          }
        >
          <Flex
            flexDirection={DIRECTION_COLUMN}
            justifyContent={JUSTIFY_CENTER}
            gridGap={SPACING.spacing12}
          >
            {image && image}
            {message}
          </Flex>
        </Modal>
      )}
    </>
  )
}
