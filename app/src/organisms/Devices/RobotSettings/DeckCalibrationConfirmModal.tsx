import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  DIRECTION_COLUMN,
  JUSTIFY_FLEX_END,
  ALIGN_CENTER,
  COLORS,
  TYPOGRAPHY,
  SPACING,
  Link,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { Modal } from '../../../atoms/Modal'
import { StyledText } from '../../../atoms/text'
import { PrimaryButton } from '../../../atoms/Buttons'

interface DeckCalibrationConfirmModalProps {
  closeModal: () => void
  confirm: () => unknown
}

export function DeckCalibrationConfirmModal({
  closeModal,
  confirm,
}: DeckCalibrationConfirmModalProps): JSX.Element {
  const { t } = useTranslation(['device_settings', 'shared'])

  return (
    <Modal
      type="warning"
      title={t('deck_calibration_modal_title')}
      onClose={closeModal}
    >
      <Flex flexDirection={DIRECTION_COLUMN}>
        <StyledText as="p">
          {t('deck_calibration_modal_description')}
        </StyledText>
        <StyledText as="p" fontWeight={TYPOGRAPHY.fontWeightSemiBold}>
          {t('deck_calibration_modal_pipette_description')}
        </StyledText>
        <Flex justifyContent={JUSTIFY_FLEX_END} alignItems={ALIGN_CENTER}>
          <Link
            role="button"
            onClick={closeModal}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
            marginRight={SPACING.spacing3}
            color={COLORS.blue}
            css={TYPOGRAPHY.fontSizeP}
            fontWeight={TYPOGRAPHY.fontWeightSemiBold}
          >
            {t('shared:cancel')}
          </Link>
          <PrimaryButton backgroundColor={COLORS.error} onClick={confirm}>
            {t('shared:yes')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Modal>
  )
}
