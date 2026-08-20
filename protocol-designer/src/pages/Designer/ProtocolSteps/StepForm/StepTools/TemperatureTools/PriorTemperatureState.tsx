import { useTranslation } from 'react-i18next'

import {
  StepFormStatus,
  StepFormStatusList,
} from '/protocol-designer/components/molecules'

import type { ReactNode } from 'react'
import type { TemperatureModuleState } from '@opentrons/step-generation'

export function PriorTemperatureState(props: {
  priorState: TemperatureModuleState
}): ReactNode {
  const { t } = useTranslation()
  const { targetTemperature } = props.priorState
  return (
    <StepFormStatusList>
      <StepFormStatus
        label={t(
          'protocol_steps:temperature_module.prior_state.temperature_label'
        )}
        value={
          targetTemperature != null
            ? t(
                'protocol_steps:temperature_module.prior_state.temperature_value',
                { value: targetTemperature }
              )
            : t(
                'protocol_steps:temperature_module.prior_state.temperature_value_off'
              )
        }
      />
    </StepFormStatusList>
  )
}
