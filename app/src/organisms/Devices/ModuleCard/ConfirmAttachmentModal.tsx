import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckboxField,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_FLEX_END,
  Text,
  TEXT_ALIGN_CENTER,
  SPACING,
  TYPOGRAPHY,
  TEXT_TRANSFORM_CAPITALIZE,
  DIRECTION_COLUMN,
} from '@opentrons/components'
import { SecondaryButton, PrimaryButton } from '../../../atoms/Buttons'
import { Modal } from '../../../atoms/Modal'
import { useHeaterShakerFromProtocol } from './hooks'
import { useDispatch } from 'react-redux'
import { Dispatch } from '../../../redux/types'
import { UpdateConfigValueAction } from '../../../redux/config/types'
import { updateConfigValue } from '../../../redux/config'

interface ConfirmAttachmentModalProps {
  onCloseClick: () => void
  onConfirmClick?: () => unknown
  isProceedToRunModal: boolean
  onResponse?: (isModalDismissed: boolean) => void
}
export const ConfirmAttachmentModal = (
  props: ConfirmAttachmentModalProps
): JSX.Element | null => {
  const {
    isProceedToRunModal,
    onCloseClick,
    onConfirmClick,
    onResponse,
  } = props
  const { t } = useTranslation(['heater_shaker', 'shared'])
  const [isDismissed, setIsDismissed] = React.useState<boolean>(false)
  const heaterShaker = useHeaterShakerFromProtocol()
  const slotNumber = heaterShaker != null ? heaterShaker.slotName : null
  const dispatch = useDispatch<Dispatch>()

  const makeModalDismissed = (isModalDismissed: boolean): void => {
    if (onResponse != null) {
      if (isDismissed) {
        onResponse(isModalDismissed)
      }
      onResponse(!isModalDismissed)
    }
  }
  console.log(isDismissed)

  return (
    <Modal
      title={t('confirm_heater_shaker_modal_attachment')}
      onClose={onCloseClick}
    >
      <Flex
        data-testid={`ConfirmAttachmentModal_body_text_${
          isProceedToRunModal ? `on_start_protocol` : `on_set_shake`
        }`}
        flexDirection={DIRECTION_COLUMN}
        fontSize={TYPOGRAPHY.fontSizeP}
      >
        <Text paddingBottom={SPACING.spacing2}>
          {t(
            isProceedToRunModal
              ? 'module_anchors_extended'
              : 'module_should_have_anchors',
            { slot: slotNumber }
          )}
        </Text>
        <Text>{t('thermal_adapter_attached_to_module')}</Text>
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        textAlign={TEXT_ALIGN_CENTER}
        paddingTop={SPACING.spacing4}
        data-testid={`ConfirmAttachmentModal_checkbox_field_${
          isProceedToRunModal ? `on_start_protocol` : `on_set_shake`
        }`}
      >
        {/* TODO(jr, 3/29/22): wire up checkbox field, pending usage of Alerts */}
        <CheckboxField
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setIsDismissed(e.currentTarget.checked)
          }
          value={isDismissed}
        />
        <Text
          paddingTop={SPACING.spacingXXS}
          paddingLeft={SPACING.spacing3}
          fontSize={TYPOGRAPHY.fontSizeP}
        >
          {t('dont_show_me_again', { ns: 'shared' })}
        </Text>
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        paddingTop={SPACING.spacingXL}
        justifyContent={JUSTIFY_FLEX_END}
      >
        <Flex
          paddingRight={SPACING.spacing2}
          data-testid={`ConfirmAttachmentModal_secondary_btn_${
            isProceedToRunModal ? `on_start_protocol` : `on_set_shake`
          }`}
        >
          <SecondaryButton
            onClick={onCloseClick}
            textTransform={TEXT_TRANSFORM_CAPITALIZE}
          >
            {t('shared:cancel')}
          </SecondaryButton>
        </Flex>

        <Flex
          data-testid={`ConfirmAttachmentModal_primary_btn_${
            isProceedToRunModal ? `on_start_protocol` : `on_set_shake`
          }`}
        >
          <PrimaryButton
            onClick={isProceedToRunModal ? onConfirmClick : makeModalDismissed}
          >
            {isProceedToRunModal
              ? t('proceed_to_run')
              : t('confirm_attachment')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </Modal>
  )
}
