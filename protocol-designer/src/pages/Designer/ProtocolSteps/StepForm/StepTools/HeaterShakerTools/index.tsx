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
import { HEATERSHAKER_MODULE_TYPE } from '@opentrons/shared-data'

import {
  DropdownStepFormField,
  ToggleExpandStepFormField,
  ToggleStepFormField,
} from '/protocol-designer/components/molecules'
import { getEnableConcurrentModuleActions } from '/protocol-designer/feature-flags/selectors'
import { getHeaterShakerLabwareOptions } from '/protocol-designer/ui/modules/selectors'
import { hoverSelection } from '/protocol-designer/ui/steps/actions/actions'

import { usePriorModuleState } from '../../hooks/usePriorModuleState'
import { PriorHeaterShakerState } from './PriorHeaterShakerState'

import type { ReactNode } from 'react'
import type { StepFormProps } from '../../types'

export function HeaterShakerTools(props: StepFormProps): ReactNode {
  const { propsForFields, formData } = props
  const { t } = useTranslation(['application', 'form', 'protocol_steps'])
  const moduleLabwareOptions = useSelector(getHeaterShakerLabwareOptions)
  const priorState = usePriorModuleState(
    propsForFields.moduleId.value as string | null,
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

      <Divider marginY={0} />

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
            <PriorHeaterShakerState priorState={priorState} />
          </Flex>

          <Divider marginY={0} />
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
          fieldTitle={t('protocol_steps:shake_speed')}
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
              ? (propsForFields.latchOpen.tooltipContent ?? null)
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
