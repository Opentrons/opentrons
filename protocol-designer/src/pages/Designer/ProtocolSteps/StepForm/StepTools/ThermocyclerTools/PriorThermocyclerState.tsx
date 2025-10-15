import { useTranslation } from 'react-i18next'

import {
  StepFormStatus,
  StepFormStatusList,
} from '/protocol-designer/components/molecules'

import type { ThermocyclerModuleState } from '@opentrons/step-generation'

export function PriorThermocyclerState(props: {
  priorState: ThermocyclerModuleState
}): JSX.Element {
  const { blockTargetTemp, lidTargetTemp, lidOpen } = props.priorState
  const { t } = useTranslation()
  return (
    <StepFormStatusList>
      <StepFormStatus
        label={t('protocol_steps:thermocycler_module.prior_state.block_label')}
        value={
          blockTargetTemp != null
            ? t('protocol_steps:thermocycler_module.prior_state.block_value', {
                value: blockTargetTemp,
              })
            : t(
                'protocol_steps:thermocycler_module.prior_state.block_value_off'
              )
        }
      />
      <StepFormStatus
        label={t('protocol_steps:thermocycler_module.prior_state.lid_label')}
        value={
          lidTargetTemp != null
            ? t('protocol_steps:thermocycler_module.prior_state.lid_value', {
                value: lidTargetTemp,
              })
            : t('protocol_steps:thermocycler_module.prior_state.lid_value_off')
        }
      />
      <StepFormStatus
        label={t(
          'protocol_steps:thermocycler_module.prior_state.lid_position_label'
        )}
        value={
          // todo(mm, 2025-09-22): Is it right to say the lid is closed by default?
          (lidOpen ?? false)
            ? t(
                'protocol_steps:thermocycler_module.prior_state.lid_position_value_open'
              )
            : t(
                'protocol_steps:thermocycler_module.prior_state.lid_position_value_closed'
              )
        }
      />
    </StepFormStatusList>
  )
}
