import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation } from 'react-router-dom'
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

interface AnnouncementModalProp {
  isViewReleaseNotes?: boolean
  onClose?: () => void
}

export const AnnouncementModal = (
  props: AnnouncementModalProp
): JSX.Element => {
  const { onClose, isViewReleaseNotes } = props
  const { t } = useTranslation(['modal', 'button'])
  const announcements = useAnnouncements()
  const location = useLocation()

  const { announcementKey, message, heading, image } = announcements[
    announcements.length - 1
  ]

  const userHasNotSeenAnnouncement =
    getLocalStorageItem(localStorageAnnouncementKey) !== announcementKey

  const userClickViewReleaseNotes =
    location.pathname === '/settings' && isViewReleaseNotes === true

  const [
    showAnnouncementModal,
    setShowAnnouncementModal,
  ] = React.useState<boolean>(
    userClickViewReleaseNotes || userHasNotSeenAnnouncement
  )

  const handleClick = (): void => {
    if (onClose != null) onClose()
    setLocalStorageItem(localStorageAnnouncementKey, announcementKey)
    setShowAnnouncementModal(false)
  }

  return (
    <>
      {showAnnouncementModal && (
        <Modal
          title={heading}
          type="info"
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
