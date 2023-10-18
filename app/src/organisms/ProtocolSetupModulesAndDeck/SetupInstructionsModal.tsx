import * as React from 'react'
import { useTranslation } from 'react-i18next'

import {
  ALIGN_STRETCH,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { Modal } from '../../molecules/Modal'

import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'

import imgSrc from '../../assets/images/on-device-display/setup_instructions_qr_code.png'

const INSTRUCTIONS_URL = 'support.opentrons.com/s/modules'

interface SetupInstructionsModalProps {
  setShowSetupInstructionsModal: (showSetupInstructionsModal: boolean) => void
}
export function SetupInstructionsModal({
  setShowSetupInstructionsModal,
}: SetupInstructionsModalProps): JSX.Element {
  const { i18n, t } = useTranslation('protocol_setup')
  const modalHeader: ModalHeaderBaseProps = {
    title: i18n.format(t('setup_instructions'), 'capitalize'),
    iconName: 'information',
    iconColor: COLORS.darkBlack100,
    hasExitIcon: true,
  }

  return (
    <Modal
      header={modalHeader}
      onOutsideClick={() => setShowSetupInstructionsModal(false)}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        alignSelf={ALIGN_STRETCH}
        gridGap={SPACING.spacing40}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
          <StyledText as="p">{t('setup_instructions_description')}</StyledText>
          <Flex
            backgroundColor={COLORS.light1}
            borderRadius={BORDERS.borderRadiusSize3}
            padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
          >
            <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {INSTRUCTIONS_URL}
            </StyledText>
          </Flex>
        </Flex>
        <img
          src={imgSrc}
          alt="Setup Instructions QR Code"
          width="178px"
          height="178px"
        />
      </Flex>
    </Modal>
  )
}
