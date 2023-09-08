import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Flex,
  SPACING,
  AlertPrimaryButton,
  SecondaryButton,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  JUSTIFY_FLEX_END,
} from '@opentrons/components'

import { LegacyModal } from '../../molecules/LegacyModal'
import { StyledText } from '../../atoms/text'

interface ModuleCalibrationConfirmModalProps {
  confirm: () => unknown
  cancel: () => unknown
}

export function ModuleCalibrationConfirmModal({
  confirm,
  cancel,
}: ModuleCalibrationConfirmModalProps): JSX.Element {
  const { i18n, t } = useTranslation(['device_settings', 'shared'])

  return (
    <LegacyModal
      type="warning"
      title={t('module_calibration_confirm_modal_title')}
      childrenPadding={SPACING.spacing24}
    >
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing24}>
        <StyledText as="p">
          {t('module_calibration_confirm_modal_body')}
        </StyledText>
        <Flex
          flexDirection={DIRECTION_ROW}
          gridGap={SPACING.spacing8}
          justifyContent={JUSTIFY_FLEX_END}
        >
          <SecondaryButton onClick={cancel}>
            {i18n.format(t('shared:cancel'), 'capitalize')}
          </SecondaryButton>
          <AlertPrimaryButton onClick={confirm}>
            {i18n.format(t('shared:clear_data'), 'capitalize')}
          </AlertPrimaryButton>
        </Flex>
      </Flex>
    </LegacyModal>
  )
}
