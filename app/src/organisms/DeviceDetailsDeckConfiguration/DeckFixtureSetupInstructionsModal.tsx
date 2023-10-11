import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ALIGN_FLEX_END,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  PrimaryButton,
  SPACING,
} from '@opentrons/components'
import { StyledText } from '../../atoms/text'
import { ExternalLink } from '../../atoms/Link/ExternalLink'
import { Modal } from '../../molecules/Modal'
import { LegacyModal } from '../../molecules/LegacyModal'

import type { ModalHeaderBaseProps } from '../../molecules/Modal/types'
import type { LegacyModalProps } from '../../molecules/LegacyModal'

import imgSrc from '../../assets/images/on-device-display/deck_fixture_setup_qrcode.png'

const SETUP_INSTRUCTION_URL =
  'https://support.opentrons.com/s/article/Deck-configuration-on-Opentrons-Flex'
const IMG_ALT = 'QRCode for Deck fixture setup instructions page'

interface DeckFixtureSetupInstructionsModalProps {
  setShowSetupInstructionsModal: (showSetupInstructionsModal: boolean) => void
  isOnDevice?: boolean
}

export function DeckFixtureSetupInstructionsModal({
  setShowSetupInstructionsModal,
  isOnDevice = false,
}: DeckFixtureSetupInstructionsModalProps): JSX.Element {
  const { i18n, t } = useTranslation(['device_details', 'shared'])
  const modalHeader: ModalHeaderBaseProps = {
    title: t('deck_fixture_setup_instructions'),
    iconName: 'information',
    iconColor: COLORS.darkBlack100,
    hasExitIcon: true,
  }

  const modalProps: LegacyModalProps = {
    title: t('deck_fixture_setup_instructions'),
    onClose: () => setShowSetupInstructionsModal(false),
    closeOnOutsideClick: true,
    childrenPadding: SPACING.spacing24,
    width: '39.3125rem',
  }

  return (
    <>
      {isOnDevice ? (
        <Modal
          header={modalHeader}
          onOutsideClick={() => setShowSetupInstructionsModal(false)}
        >
          <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing40}>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
              <StyledText as="p">
                {t('deck_fixture_setup_modal_top_description')}
              </StyledText>
              <StyledText as="p">
                {t('deck_fixture_setup_modal_bottom_description')}
              </StyledText>
            </Flex>

            <Flex>
              <img src={imgSrc} alt={IMG_ALT} width="178px" height="178px" />
            </Flex>
          </Flex>
        </Modal>
      ) : (
        <LegacyModal {...modalProps}>
          <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
            <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing24}>
              <Flex
                flexDirection={DIRECTION_COLUMN}
                gridGap={SPACING.spacing16}
              >
                <Flex
                  flexDirection={DIRECTION_COLUMN}
                  gridGap={SPACING.spacing16}
                >
                  <StyledText as="p">
                    {t('deck_fixture_setup_modal_top_description')}
                  </StyledText>
                  <StyledText as="p">
                    {t('deck_fixture_setup_modal_bottom_description_desktop')}
                  </StyledText>
                </Flex>
                <ExternalLink href={SETUP_INSTRUCTION_URL}>
                  {t('deck_fixture_setup_instructions')}
                </ExternalLink>
              </Flex>
              <Flex paddingX={SPACING.spacing32}>
                <img src={imgSrc} alt={IMG_ALT} width="194x" height="194px" />
              </Flex>
            </Flex>
            <PrimaryButton
              onClick={modalProps.onClose}
              alignSelf={ALIGN_FLEX_END}
            >
              {i18n.format(t('shared:close'), 'capitalize')}
            </PrimaryButton>
          </Flex>
        </LegacyModal>
      )}
    </>
  )
}
