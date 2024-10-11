import { useTranslation } from 'react-i18next'

import {
  ALIGN_STRETCH,
  BORDERS,
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'
import { OddModal } from '/app/molecules/OddModal'

import type { OddModalHeaderBaseProps } from '/app/molecules/OddModal/types'

import imgSrc from '/app/assets/images/on-device-display/setup_instructions_qr_code.png'

const INSTRUCTIONS_URL = 'support.opentrons.com/s/modules'

interface SetupInstructionsModalProps {
  setShowSetupInstructionsModal: (showSetupInstructionsModal: boolean) => void
}
export function SetupInstructionsModal({
  setShowSetupInstructionsModal,
}: SetupInstructionsModalProps): JSX.Element {
  const { i18n, t } = useTranslation(['protocol_setup', 'branded'])
  const modalHeader: OddModalHeaderBaseProps = {
    title: i18n.format(t('setup_instructions'), 'capitalize'),
    iconName: 'information',
    iconColor: COLORS.black90,
    hasExitIcon: true,
  }

  return (
    <OddModal
      header={modalHeader}
      onOutsideClick={() => {
        setShowSetupInstructionsModal(false)
      }}
    >
      <Flex
        flexDirection={DIRECTION_ROW}
        alignSelf={ALIGN_STRETCH}
        gridGap={SPACING.spacing40}
      >
        <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
          <LegacyStyledText as="p">
            {t('branded:setup_instructions_description')}
          </LegacyStyledText>
          <Flex
            backgroundColor={COLORS.grey35}
            borderRadius={BORDERS.borderRadius8}
            padding={`${SPACING.spacing16} ${SPACING.spacing24}`}
          >
            <LegacyStyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
              {INSTRUCTIONS_URL}
            </LegacyStyledText>
          </Flex>
        </Flex>
        <img
          src={imgSrc}
          alt="Setup Instructions QR Code"
          width="178px"
          height="178px"
        />
      </Flex>
    </OddModal>
  )
}
