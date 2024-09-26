import { useTranslation } from 'react-i18next'
import {
  ALIGN_CENTER,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  JUSTIFY_FLEX_END,
  Link,
  PrimaryButton,
  Modal,
  SPACING,
  LegacyStyledText,
  TYPOGRAPHY,
} from '@opentrons/components'

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
    <Modal
      type="warning"
      title={t('deck_calibration_modal_title')}
      onClose={cancel}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <LegacyStyledText as="p" marginBottom={SPACING.spacing16}>
          {t('deck_calibration_modal_description')}
        </LegacyStyledText>
        <LegacyStyledText
          as="p"
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
            backgroundColor={COLORS.red50}
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
