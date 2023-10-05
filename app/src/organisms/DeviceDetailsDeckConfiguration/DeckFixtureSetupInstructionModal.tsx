import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
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

import imgSrc from '../../assets/images/on-device-display/deck_fixture_setup.png'

const SETUP_INSTRUCTION_URL = 'www.opentrons.com/support/fixtures'
const IMG_ALT = 'QRCode for Deck fixture setup instructions page'

interface DeckFixtureSetupInstructionModalProps {
  setShowSetupInstructionsModal: (showSetupInstructionsModal: boolean) => void
}

export function DeckFixtureSetupInstructionModal({
  setShowSetupInstructionsModal,
}: DeckFixtureSetupInstructionModalProps): JSX.Element {
  const { t } = useTranslation('device_details')
  const modalHeader: ModalHeaderBaseProps = {
    title: t('deck_fixture_setup_instructions'),
    iconName: 'information',
    iconColor: COLORS.darkBlack100,
    hasExitIcon: true,
  }

  return (
    <Modal
      header={modalHeader}
      onOutsideClick={() => setShowSetupInstructionsModal(false)}
    >
      <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing40}>
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
            <StyledText as="p">
              {t('deck_fixture_setup_modal_top_description')}
            </StyledText>
            <StyledText as="p">
              {t('deck_fixture_setup_modal_bottom_description')}
            </StyledText>
          </Flex>
          <Flex
            padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
            backgroundColor={COLORS.light1}
            borderRadius={BORDERS.borderRadiusSize3}
          >
            <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {SETUP_INSTRUCTION_URL}
            </StyledText>
          </Flex>
        </Flex>
        <Flex>
          <img src={imgSrc} alt={IMG_ALT} width="178px" height="178px" />
        </Flex>
      </Flex>
    </Modal>
  )
}
