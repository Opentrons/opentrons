import { useTranslation } from 'react-i18next'
import {
  ALIGN_FLEX_END,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  PrimaryButton,
  SPACING,
  Modal,
  LegacyStyledText,
} from '@opentrons/components'
import { ExternalLink } from '/app/atoms/Link/ExternalLink'
import { OddModal } from '/app/molecules/OddModal'

import type { ModalProps } from '@opentrons/components'
import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

import imgSrc from '/app/assets/images/on-device-display/deck_fixture_setup_qrcode.png'

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
  const { i18n, t } = useTranslation(['device_details', 'shared', 'branded'])
  const modalHeader: OddModalHeaderBaseProps = {
    title: t('deck_fixture_setup_instructions'),
    iconName: 'information',
    iconColor: COLORS.black90,
    hasExitIcon: true,
    onClick: () => {
      setShowSetupInstructionsModal(false)
    },
  }

  const modalProps: ModalProps = {
    title: t('deck_fixture_setup_instructions'),
    onClose: () => {
      setShowSetupInstructionsModal(false)
    },
    closeOnOutsideClick: true,
    childrenPadding: SPACING.spacing24,
    width: '39.3125rem',
  }

  return (
    <>
      {isOnDevice ? (
        <OddModal
          header={modalHeader}
          onOutsideClick={() => {
            setShowSetupInstructionsModal(false)
          }}
        >
          <Flex flexDirection={DIRECTION_ROW} gridGap={SPACING.spacing40}>
            <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing12}>
              <LegacyStyledText as="p">
                {t('deck_fixture_setup_modal_top_description')}
              </LegacyStyledText>
              <LegacyStyledText as="p">
                {t('branded:deck_fixture_setup_modal_bottom_description')}
              </LegacyStyledText>
            </Flex>

            <Flex>
              <img src={imgSrc} alt={IMG_ALT} width="178px" height="178px" />
            </Flex>
          </Flex>
        </OddModal>
      ) : (
        <Modal {...modalProps}>
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
                  <LegacyStyledText as="p">
                    {t('deck_fixture_setup_modal_top_description')}
                  </LegacyStyledText>
                  <LegacyStyledText as="p">
                    {t('deck_fixture_setup_modal_bottom_description_desktop')}
                  </LegacyStyledText>
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
        </Modal>
      )}
    </>
  )
}
