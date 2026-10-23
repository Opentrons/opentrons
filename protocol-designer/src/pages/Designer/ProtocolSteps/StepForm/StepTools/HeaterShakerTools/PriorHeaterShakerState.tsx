import { useTranslation } from 'react-i18next'

import {
  StepFormStatus,
  StepFormStatusList,
} from '/protocol-designer/components/molecules'

import type { ReactNode } from 'react'
import type { HeaterShakerModuleState } from '@opentrons/step-generation'

export function PriorHeaterShakerState(props: {
  priorState: HeaterShakerModuleState
}): ReactNode {
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
          (latchOpen ?? false)
            ? t('protocol_steps:heater_shaker.prior_state.latch_value_open')
            : t('protocol_steps:heater_shaker.prior_state.latch_value_closed')
        }
      />
    </StepFormStatusList>
  )
}
