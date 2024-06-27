import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import {
  ALIGN_CENTER,
  CheckboxField,
  DIRECTION_COLUMN,
  DIRECTION_ROW,
  Flex,
  JUSTIFY_FLEX_END,
  Link,
  PrimaryButton,
  SPACING,
  StyledText,
  TEXT_ALIGN_CENTER,
  TYPOGRAPHY,
} from '@opentrons/components'
import { LegacyModal } from '../../molecules/LegacyModal'
import { updateConfigValue } from '../../redux/config'
import type { Dispatch } from '../../redux/types'
import type { UpdateConfigValueAction } from '../../redux/config/types'

export function setHeaterShakerAttached(
  heaterShakerAttached: boolean
): UpdateConfigValueAction {
  return updateConfigValue(
    'modules.heaterShaker.isAttached',
    heaterShakerAttached
  )
}
interface ConfirmAttachmentModalProps {
  onCloseClick: () => void
  isProceedToRunModal: boolean
  onConfirmClick: () => void
}
export const ConfirmAttachmentModal = (
  props: ConfirmAttachmentModalProps
): JSX.Element | null => {
  const { isProceedToRunModal, onCloseClick, onConfirmClick } = props
  const { t } = useTranslation(['heater_shaker', 'shared'])
  const [isDismissed, setIsDismissed] = React.useState<boolean>(false)
  const dispatch = useDispatch<Dispatch>()

  const confirmAttached = (): void => {
    if (isDismissed) {
      dispatch(setHeaterShakerAttached(isDismissed))
    }
    onConfirmClick()
    onCloseClick()
  }

  return (
    <LegacyModal
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
        <StyledText paddingBottom={SPACING.spacing4}>
          {t(
            isProceedToRunModal
              ? 'module_anchors_extended'
              : 'module_should_have_anchors'
          )}
        </StyledText>
        <StyledText>{t('thermal_adapter_attached_to_module')}</StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        textAlign={TEXT_ALIGN_CENTER}
        paddingTop={SPACING.spacing16}
        data-testid={`ConfirmAttachmentModal_checkbox_field_${
          isProceedToRunModal ? `on_start_protocol` : `on_set_shake`
        }`}
      >
        <CheckboxField
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setIsDismissed(e.currentTarget.checked)
          }
          value={isDismissed}
        />
        <StyledText
          paddingTop="1px"
          paddingLeft={SPACING.spacing8}
          fontSize={TYPOGRAPHY.fontSizeP}
        >
          {t('dont_show_me_again', { ns: 'shared' })}
        </StyledText>
      </Flex>
      <Flex
        flexDirection={DIRECTION_ROW}
        paddingTop={SPACING.spacing32}
        justifyContent={JUSTIFY_FLEX_END}
        alignItems={ALIGN_CENTER}
      >
        <Flex
          paddingRight={SPACING.spacing4}
          data-testid={`ConfirmAttachmentModal_secondary_btn_${
            isProceedToRunModal ? `on_start_protocol` : `on_set_shake`
          }`}
        >
          <Link
            role="button"
            onClick={onCloseClick}
            textTransform={TYPOGRAPHY.textTransformCapitalize}
            marginRight={SPACING.spacing24}
            css={TYPOGRAPHY.linkPSemiBold}
          >
            {t('shared:cancel')}
          </Link>
        </Flex>

        <Flex
          data-testid={`ConfirmAttachmentModal_primary_btn_${
            isProceedToRunModal ? `on_start_protocol` : `on_set_shake`
          }`}
        >
          <PrimaryButton onClick={confirmAttached}>
            {isProceedToRunModal
              ? t('proceed_to_run')
              : t('confirm_attachment')}
          </PrimaryButton>
        </Flex>
      </Flex>
    </LegacyModal>
  )
}
