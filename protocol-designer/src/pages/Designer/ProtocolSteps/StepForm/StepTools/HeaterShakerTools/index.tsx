import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'

import {
  Box,
  COLORS,
  DIRECTION_COLUMN,
  Flex,
  SPACING,
  StyledText,
} from '@opentrons/components'
import { HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'
import { HeaterShakerModuleState as SG_HeaterShakerModuleState } from '@opentrons/step-generation'

import {
  DropdownStepFormField,
  StepFormStatus,
  StepFormStatusList,
  ToggleExpandStepFormField,
  ToggleStepFormField,
} from '/protocol-designer/components/molecules'
import { getEnableConcurrentModuleActions } from '/protocol-designer/feature-flags/selectors'
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getHeaterShakerLabwareOptions } from '/protocol-designer/ui/modules/selectors'
import { hoverSelection } from '/protocol-designer/ui/steps/actions/actions'

import { usePriorModuleState } from '../../hooks/usePriorModuleState'

import type { StepFormProps } from '../../types'

export function HeaterShakerTools(props: StepFormProps): JSX.Element {
  const { propsForFields, formData } = props
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])
  const moduleLabwareOptions = useSelector(getHeaterShakerLabwareOptions)
  const priorState = usePriorModuleState(
    propsForFields.moduleId.value as any,
    HEATERSHAKER_MODULE_TYPE
  )
  const enableConcurrentModuleActions = useSelector(
    getEnableConcurrentModuleActions
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
        options={moduleLabwareOptions}
        title={t('protocol_steps:module')}
        onEnter={(id: string) => {
          dispatch(hoverSelection({ id, text: t('select') }))
        }}
        onExit={() => {
          dispatch(hoverSelection({ id: null, text: null }))
        }}
        width="100%"
        tooltipContent={null}
      />

      <Box borderBottom={`1px solid ${COLORS.grey30}`} />

      {enableConcurrentModuleActions && priorState !== null && (
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
            <PriorState priorState={priorState} />
          </Flex>

          <Box borderBottom={`1px solid ${COLORS.grey30}`} />
        </>
      )}

      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing4}
        paddingX={SPACING.spacing16}
      >
        <StyledText desktopStyle="bodyDefaultSemiBold">
          {t('protocol_steps:heater_shaker_state')}
        </StyledText>
        <ToggleExpandStepFormField
          {...propsForFields.targetHeaterShakerTemperature}
          toggleValue={propsForFields.setHeaterShakerTemperature.value}
          toggleUpdateValue={
            propsForFields.setHeaterShakerTemperature.updateValue
          }
          title={t(
            'form:step_edit_form.field.heaterShaker.temperature.setTemperature'
          )}
          fieldTitle={t('protocol_steps:temperature')}
          isSelected={formData.setHeaterShakerTemperature === true}
          units={t('units.degrees')}
          onLabel={t(
            'form:step_edit_form.field.heaterShaker.temperature.toggleOn'
          )}
          offLabel={t(
            'form:step_edit_form.field.heaterShaker.temperature.toggleOff'
          )}
        />
        <ToggleExpandStepFormField
          {...propsForFields.targetSpeed}
          toggleValue={propsForFields.setShake.value}
          toggleUpdateValue={propsForFields.setShake.updateValue}
          title={t('form:step_edit_form.field.heaterShaker.shaker.setShake')}
          fieldTitle={t('protocol_steps:speed')}
          isSelected={formData.setShake === true}
          units={t('units.rpm')}
          onLabel={t('form:step_edit_form.field.heaterShaker.shaker.toggleOn')}
          offLabel={t(
            'form:step_edit_form.field.heaterShaker.shaker.toggleOff'
          )}
        />
        <ToggleStepFormField
          isDisabled={propsForFields.latchOpen.disabled}
          title={t('form:step_edit_form.field.heaterShaker.latch.setLatch')}
          isSelected={propsForFields.latchOpen.value === true}
          onLabel={t('form:step_edit_form.field.heaterShaker.latch.toggleOn')}
          offLabel={t('form:step_edit_form.field.heaterShaker.latch.toggleOff')}
          toggleUpdateValue={propsForFields.latchOpen.updateValue}
          toggleValue={propsForFields.latchOpen.value}
          tooltipContent={
            propsForFields.latchOpen.disabled
              ? propsForFields.latchOpen.tooltipContent ?? null
              : null
          }
        />
        <ToggleExpandStepFormField
          {...propsForFields.heaterShakerTimer}
          toggleValue={propsForFields.heaterShakerSetTimer.value}
          toggleUpdateValue={propsForFields.heaterShakerSetTimer.updateValue}
          title={t(
            'form:step_edit_form.field.heaterShaker.timer.heaterShakerSetTimer'
          )}
          fieldTitle={t('form:step_edit_form.field.heaterShaker.duration')}
          isSelected={formData.heaterShakerSetTimer === true}
          units={t('application:units.time_hms')}
          toggleElement="checkbox"
        />
      </Flex>
    </Flex>
  )
}

function PriorState(props: {
  priorState: SG_HeaterShakerModuleState
}): JSX.Element {
  const { targetTemp, targetSpeed, latchOpen } = props.priorState
  const { t } = useTranslation()
  return (
    <StepFormStatusList>
      <StepFormStatus
        label={t('protocol_steps:heater_shaker.prior_state.heater_label')}
        value={
          targetTemp != null
            ? t('protocol_steps:heater_shaker.prior_state.heater_value', {
                value: targetTemp,
              })
            : t('protocol_steps:heater_shaker.prior_state.heater_value_off')
        }
      />
      <StepFormStatus
        label={t('protocol_steps:heater_shaker.prior_state.shaker_label')}
        value={
          targetSpeed != null
            ? t('protocol_steps:heater_shaker.prior_state.shaker_value', {
                value: targetSpeed,
              })
            : t('protocol_steps:heater_shaker.prior_state.shaker_value_off')
        }
      />
      <StepFormStatus
        label={t('protocol_steps:heater_shaker.prior_state.latch_label')}
        value={
          latchOpen ?? false
            ? t('protocol_steps:heater_shaker.prior_state.latch_value_open')
            : t('protocol_steps:heater_shaker.prior_state.latch_value_closed')
        }
      />
    </StepFormStatusList>
  )
}
