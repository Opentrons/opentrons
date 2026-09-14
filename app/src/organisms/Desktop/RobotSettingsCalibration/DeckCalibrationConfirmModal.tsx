import { useTranslation } from 'react-i18next'

import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  LegacyStyledText,
  Link,
  Modal,
  PrimaryButton,
  SPACING,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { ReactNode } from 'react'

interface DeckCalibrationConfirmModalProps {
  confirm: () => unknown
  cancel: () => unknown
}

export function DeckCalibrationConfirmModal({
  confirm,
  cancel,
}: DeckCalibrationConfirmModalProps): ReactNode {
  const { t } = useTranslation(['device_settings', 'shared'])

  return (
    <Modal
      type="warning"
      title={t('deck_calibration_modal_title')}
      onClose={cancel}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText forwardedAs="p" marginBottom={SPACING.spacing16}>
          {t('deck_calibration_modal_description')}
        </LegacyStyledText>
        <LegacyStyledText
          forwardedAs="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacing24}
        >
          {t('deck_calibration_modal_pipette_description')}
        </LegacyStyledText>
        <Flex justifyContent={JUSTIFY_FLEX_END} alignItems={ALIGN_CENTER}>
          <Link
            role="button"
            onClick={cancel}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            marginRight={SPACING.spacing24}
            color={COLORS.blue50}
            css={TYPOGRAPHY.fontSizeP}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {t('shared:cancel')}
          </Link>
          <PrimaryButton
            variant="warning"
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            css={TYPOGRAPHY.fontSizeP}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            onClick={confirm}
          >
            {t('shared:yes')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Modal>
  )
}
