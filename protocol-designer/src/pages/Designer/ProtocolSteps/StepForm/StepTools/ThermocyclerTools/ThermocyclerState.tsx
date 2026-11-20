import { useTranslation } from 'react-i18next'

import {
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'

import {
  ToggleExpandStepFormField,
  ToggleStepFormField,
} from '/protocol-designer/components/molecules'

import type { ReactNode } from 'react'
import type { FormData } from '/protocol-designer/form-types'
import type { FieldPropsByName } from '../../types'

interface ThermocyclerStateProps {
  title: string
  formData: FormData
  propsForFields: FieldPropsByName
  showFormErrors?: boolean
  focusedField?: string | null
}

export function ThermocyclerState(props: ThermocyclerStateProps): ReactNode {
  const { title, propsForFields, formData } = props
  const { i18n, t } = useTranslation(['application', 'form'])

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing4}
      paddingX={SPACING.spacing16}
    >
      <Flex flexDirection={DIRECTION_COLUMN} gridGap={SPACING.spacing4}>
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {i18n.format(title, 'capitalize')}
        </StyledText>
      </Flex>
      <ToggleExpandStepFormField
        {...propsForFields.blockTargetTemp}
        toggleValue={propsForFields.blockIsActive.value}
        toggleUpdateValue={propsForFields.blockIsActive.updateValue}
        title={t('form:step_edit_form.field.thermocyclerState.block.engage')}
        fieldTitle={i18n.format(t('stepType.temperature'), 'capitalize')}
        units={t('units.degrees')}
        isSelected={formData.blockIsActive === true}
        onLabel={t('form:step_edit_form.field.heaterShaker.shaker.toggleOn')}
        offLabel={t('form:step_edit_form.field.heaterShaker.shaker.toggleOff')}
      />
      <ToggleExpandStepFormField
        {...propsForFields.lidTargetTemp}
        toggleValue={propsForFields.lidIsActive.value}
        toggleUpdateValue={propsForFields.lidIsActive.updateValue}
        title={t('form:step_edit_form.field.thermocyclerState.lid.engage')}
        fieldTitle={i18n.format(t('stepType.temperature'), 'capitalize')}
        units={t('units.degrees')}
        isSelected={formData.lidIsActive === true}
        onLabel={t('form:step_edit_form.field.thermocyclerState.lid.toggleOn')}
        offLabel={t(
          'form:step_edit_form.field.thermocyclerState.lid.toggleOff'
        )}
      />
      <ToggleStepFormField
        isDisabled={propsForFields.lidOpen.disabled}
        title={t(
          'form:step_edit_form.field.thermocyclerState.lidPosition.label'
        )}
        isSelected={propsForFields.lidOpen.value === true}
        onLabel={t(
          'form:step_edit_form.field.thermocyclerState.lidPosition.toggleOn'
        )}
        offLabel={t(
          'form:step_edit_form.field.thermocyclerState.lidPosition.toggleOff'
        )}
        toggleUpdateValue={propsForFields.lidOpen.updateValue}
        toggleValue={propsForFields.lidOpen.value}
        tooltipContent={
          propsForFields.lidOpen.disabled
            ? (propsForFields.lidOpen.tooltipContent ?? null)
            : null
        }
      />
    </Flex>
  )
}
