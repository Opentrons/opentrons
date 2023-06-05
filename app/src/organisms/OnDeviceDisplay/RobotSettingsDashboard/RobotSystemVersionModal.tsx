import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useHistory } from 'react-router-dom'

import {
  Flex,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Icon,
  TYPOGRAPHY,
  PrimaryButton,
  SecondaryButton,
  ALIGN_CENTER,
  COLORS,
  SPACING,
  BORDERS,
} from '@opentrons/components'

import { Modal } from '../../../molecules/Modal'
import { ReleaseNotes } from '../../../molecules/ReleaseNotes'
import { StyledText } from '../../../atoms/text'

interface RobotSystemVersionModalProps {
  version: string
  releaseNotes: string
  setShowModal: (showModal: boolean) => void
}

// ToDo (kj:02/24/2023) We will need to decide to create or extend the existing modal for the ODD
// Current modal's design is different from the ODD's one.

export function RobotSystemVersionModal({
  version,
  releaseNotes,
  setShowModal,
}: RobotSystemVersionModalProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])
  const history = useHistory()

  return (
    <Flex padding={SPACING.spacing40}>
      <Modal
        title={t('robot_system_version_available', {
          releaseVersion: version,
        })}
        type="warning"
        width="59rem"
        height="32.5rem"
        // Note (kj:02/24/2023) ModalShell uses marginLeft to centralize modal body because of the desktop nav
        // If we utilize the existing modal for the ODD, we will need to pass a boolean for that adjustment
        marginLeft="1.5rem"
      >
        <Flex flexDirection={DIRECTION_COLUMN}>
          <Flex
            flexDirection={DIRECTION_ROW}
            alignItems={ALIGN_CENTER}
            paddingX={SPACING.spacing16}
            paddingY={SPACING.spacing24}
            backgroundColor={COLORS.light2}
            borderRadius={BORDERS.borderRadiusSize3}
            marginY={SPACING.spacing24}
          >
            <Icon
              size="1.5rem"
              name="information"
              color={COLORS.darkGreyEnabled}
            />
            <StyledText
              fontSize="1.375rem"
              lineHeight="2rem"
              fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            >
              {t('updating_ot3')}
            </StyledText>
          </Flex>
          <ReleaseNotes source={releaseNotes} />
        </Flex>
        <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing12}>
          <SecondaryButton
            flex="1"
            onClick={() => setShowModal(false)}
            fontSize="1.5rem"
            lineHeight="1.375rem"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            height="4.375rem"
          >
            {t('remind_me_later')}
          </SecondaryButton>

          <PrimaryButton
            flex="1"
            onClick={() => history.push('/robot-settings/update-robot')}
            fontSize="1.5rem"
            lineHeight="1.375rem"
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            height="4.375rem"
          >
            {t('shared:update')}
          </PrimaryButton>
        </Flex>
      </Modal>
    </Flex>
  )
}
