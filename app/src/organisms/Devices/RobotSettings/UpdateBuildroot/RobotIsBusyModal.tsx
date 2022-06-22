import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'

import {
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_END,
  SPACING,
  TEXT_TRANSFORM_CAPITALIZE,
  TYPOGRAPHY,
  ALIGN_CENTER,
  Btn,
} from '@opentrons/components'
import { Modal } from '../../../../atoms/Modal'
import { PrimaryButton } from '../../../../atoms/buttons'
import { StyledText } from '../../../../atoms/text'

interface RobotIsBusyModalProps {
  closeModal: () => void
  proceed: () => void
}

export function RobotIsBusyModal({
  closeModal,
  proceed,
}: RobotIsBusyModalProps): JSX.Element {
  const { t } = useTranslation(['device_details', 'shared'])

  return (
    <Modal type="warning" title={t('robot_is_busy')}>
      <Flex flexDirection={DIRECTION_COLUMN}>
        <Trans
          t={t}
          i18nKey="this_robot_will_restart_with_update"
          components={{
            block: <StyledText as="p" marginBottom={SPACING.spacing2} />,
          }}
        />
        <Flex
          justifyContent={JUSTIFY_FLEX_END}
          alignItems={ALIGN_CENTER}
          marginTop={SPACING.spacing3}
        >
          <Btn
            onClick={closeModal}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            marginRight={SPACING.spacing5}
            css={TYPOGRAPHY.linkPSemiBold}
          >
            {t('shared:cancel')}
          </Btn>
          <PrimaryButton onClick={proceed}>{t('yes_update_now')}</PrimaryButton>
        </Flex>
      </Flex>
    </Modal>
  )
}
