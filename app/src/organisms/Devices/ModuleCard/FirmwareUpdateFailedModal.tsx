import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  DIRECTION_ROW,
  Flex,
  JUSTIFY_FLEX_END,
  Text,
  SPACING,
  TYPOGRAPHY,
  DIRECTION_COLUMN,
  Icon,
  COLORS,
  TEXT_TRANSFORM_CAPITALIZE,
} from '@opentrons/components'
import { PrimaryButton } from '../../../atoms/Buttons'
import { Modal } from '../../../atoms/Modal'

import type { AttachedModule } from '../../../redux/modules/types'

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
        color={COLORS.error}
        name="information"
        aria-label="information"
      />
      <Text marginLeft={SPACING.spacing3}>{t('firmware_update_failed')}</Text>
    </Flex>
  )

  return (
    <Modal title={title} onClose={onCloseClick}>
      <Flex
        flexDirection={DIRECTION_COLUMN}
        fontSize={TYPOGRAPHY.fontSizeP}
        data-testid={`FirmwareUpdateFailedModal_body_text_${module.serial}`}
      >
        <Text paddingBottom={SPACING.spacing2}>
          {t('an_error_occurred_while_updating')}
        </Text>
        <Text paddingBottom={SPACING.spacing2}>
          {t('bundle_firmware_file_not_found', { module: module.type })}
        </Text>
        <Text>{errorMessage}</Text>
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        paddingTop={SPACING.spacingXL}
        justifyContent={JUSTIFY_FLEX_END}
        data-testid={`FirmwareUpdateFailedModal_cancel_btn_${module.serial}`}
      >
        <Flex textTransform={TEXT_TRANSFORM_CAPITALIZE}>
          <PrimaryButton onClick={onCloseClick}>
            {t('shared:close')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Modal>
  )
}
