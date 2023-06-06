import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  OVERFLOW_AUTO,
  SPACING,
} from '@opentrons/components'

import { SmallButton } from '../../atoms/buttons'
import { InlineNotification } from '../../atoms/InlineNotification'
import { ReleaseNotes } from '../../molecules/ReleaseNotes'
import { Modal } from '../../molecules/Modal/OnDeviceDisplay/Modal'

import type { ModalHeaderBaseProps } from '../../molecules/Modal/OnDeviceDisplay/types'

interface RobotSystemVersionModalProps {
  version: string
  releaseNotes: string
  setShowModal: (showModal: boolean) => void
}

export function RobotSystemVersionModal({
  version,
  releaseNotes,
  setShowModal,
}: RobotSystemVersionModalProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()

  const modalHeader: ModalHeaderBaseProps = {
    title: t('robot_system_version_available', {
      releaseVersion: version,
    }),
  }

  return (
    <Modal header={modalHeader} modalSize="large">
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing32}
        width="100%"
      >
        <Flex
          flexDirection={DIRECTION_COLUMN}
          gridGap={SPACING.spacing24}
          overflow={OVERFLOW_AUTO}
        >
          <InlineNotification
            type="neutral"
            heading={t('updating_robot_system')}
            hug
          />
          <ReleaseNotes source={releaseNotes} />
        </Flex>
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing8}>
          <SmallButton
            flex="1"
            onClick={() => setShowModal(false)}
            buttonText={t('not_now')}
            buttonType="secondary"
          />
          <SmallButton
            flex="1"
            onClick={() => history.push('/robot-settings/update-robot')}
            buttonText={t('shared:update')}
            buttonType="primary"
          />
        </Flex>
      </Flex>
    </Modal>
  )
}
