import { useTranslation } from 'react-i18next'
import { getModuleDisplayName } from '@opentrons/shared-data'
import {
  COLORS,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  PrimaryButton,
  SPACING,
  LegacyStyledText,
  Modal,
  TYPOGRAPHY,
} from '@opentrons/components'

import type { AttachedModule } from '/app/redux/modules/types'

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
        width={SPACING.spacing20}
        color={COLORS.red50}
        name="information"
        aria-label="information"
      />
      <LegacyStyledText marginLeft={SPACING.spacing8}>
        {t('firmware_update_failed')}
      </LegacyStyledText>
    </Flex>
  )

  return (
    <Modal title={title} onClose={onCloseClick}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        data-testid={`FirmwareUpdateFailedModal_body_text_${module.serialNumber}`}
      >
        <LegacyStyledText paddingBottom={SPACING.spacing4}>
          {t('an_error_occurred_while_updating_module', {
            moduleName: getModuleDisplayName(module.moduleModel),
          })}
        </LegacyStyledText>
        <LegacyStyledText>{errorMessage}</LegacyStyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        paddingTop={SPACING.spacing32}
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
