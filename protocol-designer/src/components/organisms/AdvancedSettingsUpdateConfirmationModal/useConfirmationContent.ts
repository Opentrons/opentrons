import { useTranslation } from 'react-i18next'

import { getLiquidClassDisplayName } from '../../../liquid-defs/utils'

import type { StepType } from '../../../form-types'

export function useConfirmationContent(
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
      joiner =
        changedFields.length === 2
          ? t('field_update_confirmation_modal.string_helpers.and_spaces')
          : t('field_update_confirmation_modal.string_helpers.and_comma_spaces')
    }
    if (i < changedFields.length - 2) {
      joiner = t('field_update_confirmation_modal.string_helpers.comma_space')
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
