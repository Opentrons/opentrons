import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_END,
  ALIGN_CENTER,
  COLORS,
  TYPOGRAPHY,
  PrimaryButton,
  SPACING,
  Link,
} from '@opentrons/components'
import { LegacyModal } from '../../molecules/LegacyModal'
import { StyledText } from '../../atoms/text'

interface DeckCalibrationConfirmModalProps {
  confirm: () => unknown
  cancel: () => unknown
}

export function DeckCalibrationConfirmModal({
  confirm,
  cancel,
}: DeckCalibrationConfirmModalProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])

  return (
    <LegacyModal
      type="warning"
      title={t('deck_calibration_modal_title')}
      onClose={cancel}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText as="p" marginBottom={SPACING.spacing16}>
          {t('deck_calibration_modal_description')}
        </StyledText>
        <StyledText
          as="p"
          fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          marginBottom={SPACING.spacing24}
        >
          {t('deck_calibration_modal_pipette_description')}
        </StyledText>
        <Flex justifyContent={JUSTIFY_FLEX_END} alignItems={ALIGN_CENTER}>
          <Link
            role="button"
            onClick={cancel}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            marginRight={SPACING.spacing24}
            color={COLORS.blueEnabled}
            css={TYPOGRAPHY.fontSizeP}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {t('shared:cancel')}
          </Link>
          <PrimaryButton
            backgroundColor={COLORS.errorEnabled}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            css={TYPOGRAPHY.fontSizeP}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
            onClick={confirm}
          >
            {t('shared:yes')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </LegacyModal>
  )
}
