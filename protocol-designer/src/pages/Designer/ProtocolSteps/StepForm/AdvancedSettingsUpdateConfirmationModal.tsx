import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import {
  COLORS,
  Flex,
  Icon,
  JUSTIFY_FLEX_END,
  Modal,
  PrimaryButton,
  SecondaryButton,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { getMainPagePortalEl } from '../../../../components/organisms'
import { getLiquidClassDisplayName } from '../../../../liquid-defs/utils'
import type { FormData, StepType } from '../../../../form-types'

interface SettingsUpdateConfirmationModalProps {
  formData: FormData
  fieldsChangedRequiringConfirmation: string[]
  onKeepExistingSettings: () => void
  onConfirmUpdateSettings: () => void
  onClose: () => void
}

export function SettingsUpdateConfirmationModal(
  props: SettingsUpdateConfirmationModalProps
): JSX.Element {
  const {
    formData,
    fieldsChangedRequiringConfirmation,
    onKeepExistingSettings,
    onConfirmUpdateSettings,
    onClose,
  } = props
  const { t } = useTranslation('form')
  const { title, body } = useConfirmationContent(
    fieldsChangedRequiringConfirmation,
    formData.liquidClass as string,
    formData.stepType
  )
  return createPortal(
    <Modal
      title={title}
      titleElement1={
        <Icon name="ot-alert" size="1.25rem" color={COLORS.yellow50} />
      }
      closeOnOutsideClick
      onClose={onClose}
      footer={
        <Flex
          gridGap={SPACING.spacing8}
          justifyContent={JUSTIFY_FLEX_END}
          padding={`0 ${SPACING.spacing24} ${SPACING.spacing24}`}
        >
          <SecondaryButton onClick={onKeepExistingSettings}>
            {t('field_update_confirmation_modal.footer.use_current_settings')}
          </SecondaryButton>
          <PrimaryButton onClick={onConfirmUpdateSettings}>
            {t('field_update_confirmation_modal.footer.update_settings')}
          </PrimaryButton>
        </Flex>
      }
    >
      <StyledText desktopStyle="bodyDefaultRegular">{body}</StyledText>
    </Modal>,
    getMainPagePortalEl()
  )
}

function useConfirmationContent(
  changedFields: string[],
  liquidClass: string,
  stepType: StepType
): { title: string; body: string } {
  const { t } = useTranslation('form')
  const liquidClassDisplayName = getLiquidClassDisplayName(liquidClass)
  const stepTypeDisplayName = t(
    `field_update_confirmation_modal.steps.${stepType}`
  )
  const changedFieldsDisplay = changedFields.reduce<string>((acc, field, i) => {
    let joiner = ''
    if (i === changedFields.length - 2) {
      joiner = changedFields.length === 2 ? ' and ' : ', and '
    }
    if (i < changedFields.length - 2) {
      joiner = ', '
    }
    return acc + t(`field_update_confirmation_modal.fields.${field}`) + joiner
  }, '')

  if (changedFields.some(field => field === 'liquidClass')) {
    return liquidClass === 'none'
      ? {
          title: t('field_update_confirmation_modal.no_liquid_class.title'),
          body: t('field_update_confirmation_modal.no_liquid_class.body'),
        }
      : {
          title: t('field_update_confirmation_modal.liquid_class.title', {
            liquidClass: liquidClassDisplayName,
          }),
          body: t('field_update_confirmation_modal.liquid_class.body', {
            liquidClass: liquidClassDisplayName,
            stepType: stepTypeDisplayName,
          }),
        }
  }
  return {
    title: t('field_update_confirmation_modal.other_fields.title', {
      liquidClass: liquidClassDisplayName,
    }),
    body: t('field_update_confirmation_modal.other_fields.body', {
      fieldNames: changedFieldsDisplay,
      stepType: stepTypeDisplayName,
    }),
  }
}
