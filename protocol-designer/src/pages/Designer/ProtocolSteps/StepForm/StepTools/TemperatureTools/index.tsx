import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  COLORS,
  DIRECTION_COLUMN,
  Divider,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { TEMPERATURE_MODULE_TYPE } from '@opentrons/shared-data'

import {
  DropdownStepFormField,
  ToggleExpandStepFormField,
} from '/protocol-designer/components/molecules'
import { getEnableConcurrentModuleActions } from '/protocol-designer/feature-flags/selectors'
import { getTemperatureLabwareOptions } from '/protocol-designer/ui/modules/selectors'
import { hoverSelection } from '/protocol-designer/ui/steps/actions/actions'

import { usePriorModuleState } from '../../hooks/usePriorModuleState'
import { PriorTemperatureState } from './PriorTemperatureState'

import type { ReactNode } from 'react'
import type { StepFormProps } from '../../types'

export function TemperatureTools(props: StepFormProps): ReactNode {
  const { propsForFields, formData } = props
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])
  const moduleLabwareOptions = useSelector(getTemperatureLabwareOptions)
  const enableConcurrentModuleActions = useSelector(
    getEnableConcurrentModuleActions
  )
  const priorState = usePriorModuleState(
    propsForFields.moduleId.value as string | null,
    TEMPERATURE_MODULE_TYPE
  )
  const dispatch = useDispatch()

  return (
    <Flex
      flexDirection={DIRECTION_COLUMN}
      gridGap={SPACING.spacing12}
      paddingY={SPACING.spacing16}
    >
      <DropdownStepFormField
        {...propsForFields.moduleId}
        tooltipContent={null}
        width="100%"
        options={moduleLabwareOptions}
        title={t('protocol_steps:module')}
        onEnter={(id: string) => {
          dispatch(hoverSelection({ id, text: t('select') }))
        }}
        onExit={() => {
          dispatch(hoverSelection({ id: null, text: null }))
        }}
      />
      <Divider marginY={0} />
      {enableConcurrentModuleActions && priorState != null && (
        <>
          <Flex
            flexDirection={DIRECTION_COLUMN}
            gridGap={SPACING.spacing8}
            paddingX={SPACING.spacing16}
          >
            <StyledText
              desktopStyle="bodyDefaultSemiBold"
              color={COLORS.black90}
            >
              {t('protocol_steps:prior_state')}
            </StyledText>
            <PriorTemperatureState priorState={priorState} />
          </Flex>
          <Divider marginY={0} />
        </>
      )}
      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        padding={`0 ${SPACING.spacing16}`}
      >
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('form:step_edit_form.temperature.state')}
        </StyledText>
        <ToggleExpandStepFormField
          {...propsForFields.targetTemperature}
          toggleValue={propsForFields.setTemperature.value}
          toggleUpdateValue={propsForFields.setTemperature.updateValue}
          title={t('form:step_edit_form.heat_or_cool')}
          fieldTitle={t('form:step_edit_form.field.temperature.setTemperature')}
          units={t('units.degrees')}
          isSelected={formData.setTemperature === 'true'}
          onLabel={t('form:step_edit_form.field.temperature.toggleOn')}
          offLabel={t('form:step_edit_form.field.temperature.toggleOff')}
        />
      </Flex>
    </Flex>
  )
}
