import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { getModuleDisplayName } from '@opentrons/shared-data'
import {
  DIRECTION_ROW,
  Flex,
  JUSTIFY_FLEX_END,
  SPACING,
  DIRECTION_COLUMN,
  Icon,
  COLORS,
  TYPOGRAPHY,
} from '@opentrons/components'
import { PrimaryButton } from '../../atoms/buttons'
import { StyledText } from '../../atoms/text'
import { Modal } from '../../molecules/Modal'

import type { AttachedModule } from '../../redux/modules/types'

interface FirmwareUpdateFailedModalProps {
  onCloseClick: () => void
  module: AttachedModule
  errorMessage?: string
}
export const FirmwareUpdateFailedModal = (
  props: FirmwareUpdateFailedModalProps
): JSX.Element => {
  const { onCloseClick, module, errorMessage } = props
  const { t } = useTranslation(['device_details', 'shared'])

  const title = (
    <Flex flexDirection={DIRECTION_ROW}>
      <Icon
        width={SPACING.spacingM}
        color={COLORS.errorEnabled}
        name="information"
        aria-label="information"
      />
      <StyledText marginLeft={SPACING.spacing3}>
        {t('firmware_update_failed')}
      </StyledText>
    </Flex>
  )

  return (
    <Modal title={title} onClose={onCloseClick}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        data-testid={`FirmwareUpdateFailedModal_body_text_${module.serialNumber}`}
      >
        <StyledText paddingBottom={SPACING.spacing2}>
          {t('an_error_occurred_while_updating_module', {
            moduleName: getModuleDisplayName(module.moduleModel),
          })}
        </StyledText>
        <StyledText>{errorMessage}</StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        paddingTop={SPACING.spacingXL}
        justifyContent={JUSTIFY_FLEX_END}
        data-testid={`FirmwareUpdateFailedModal_cancel_btn_${module.serialNumber}`}
      >
        <PrimaryButton
          onClick={onCloseClick}
          textTransform={TYPOGRAPHY.textTransformCapitalize}
        >
          {t('shared:close')}
        </PrimaryButton>
      </Flex>
    </Modal>
  )
}
