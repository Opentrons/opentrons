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
import { getRobotStateAtActiveItem } from '/protocol-designer/top-selectors/labware-locations'
import { getHeaterShakerLabwareOptions } from '/protocol-designer/ui/modules/selectors'
import { hoverSelection } from '/protocol-designer/ui/steps/actions/actions'

import type { StepFormProps } from '../../types'

export function HeaterShakerTools(props: StepFormProps): JSX.Element {
  const { propsForFields, formData } = props
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])
  const moduleLabwareOptions = useSelector(getHeaterShakerLabwareOptions)
  const dispatch = useDispatch()

  const priorState = usePriorHeaterShakerState(
    propsForFields.moduleId.value as string
  )

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

      <Flex
        flexDirection={DIRECTION_COLUMN}
        gridGap={SPACING.spacing8}
        paddingX={SPACING.spacing16}
      >
        {/* TODO: i18n, and stuff this behind a feature flag. */}
        <StyledText desktopStyle="bodyDefaultSemiBold" color={COLORS.black90}>
          Last module state
        </StyledText>
        {priorState != null && <PriorState priorState={priorState} />}
      </Flex>

      <Box borderBottom={`1px solid ${COLORS.grey30}`} />

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
  // TODO: Use i18n for these.
  const { targetTemp, targetSpeed, latchOpen } = props.priorState
  const targetTempString = targetTemp != null ? `${targetTemp} °C` : 'Off'
  const targetSpeedString = targetSpeed != null ? `${targetSpeed} rpm` : 'Off'
  const latchOpenString = latchOpen ?? false ? 'Open' : 'Closed' // TODO: Is it right to default to false?

  return (
    <StepFormStatusList>
      <StepFormStatus label="Heater set to" value={targetTempString} />
      <StepFormStatus label="Shaker set to" value={targetSpeedString} />
      <StepFormStatus label="Labware latch" value={latchOpenString} />
    </StepFormStatusList>
  )
}

function usePriorHeaterShakerState(
  moduleId: string
): SG_HeaterShakerModuleState | null {
  // TODO: I think getRobotStateAtActiveItem returns the robot state just before the
  // current step, which is what we want, but double-check that this is actually always
  // the case.
  const state = useSelector(getRobotStateAtActiveItem)
  const moduleState = state?.modules[moduleId]?.moduleState
  const fallback: SG_HeaterShakerModuleState = {
    type: HEATERSHAKER_MODULE_TYPE,
    latchOpen: false,
    targetSpeed: null,
    targetTemp: null,
  }

  // Shouldn't happen:
  if (moduleState == null) {
    console.error("Couldn't find module state.")
    return fallback
  } else if (moduleState.type !== HEATERSHAKER_MODULE_TYPE) {
    console.error(
      'Expecting Heater-Shaker module type, but got:',
      moduleState.type
    )
    return fallback
  }

  return moduleState
}
