import { useTranslation } from 'react-i18next'

import {
  StepFormStatus,
  StepFormStatusList,
} from '/protocol-designer/components/molecules'

import type { ThermocyclerModuleState } from '@opentrons/step-generation'

export function PriorThermocyclerState(props: {
  priorState: ThermocyclerModuleState
}): JSX.Element {
  const { currentBlockActivity, lidTargetTemp, lidOpen } = props.priorState
  const { t } = useTranslation()

  let blockValueText
  switch (currentBlockActivity.type) {
    // The 'profile' case shouldn't actually be reachable. It would mean this component
    // is being rendered in a point in the timeline where a profile is ongoing, which
    // would mean a Thermocycler form is being rendered at a point in the timeline
    // where a profile is ongoing, which would mean a Thermocycler profile has a
    // Thermocycler step nested within it, which shouldn't be possible.
    case 'blockDeactivated':
    case 'profile':
      blockValueText = t(
        'protocol_steps:thermocycler_module.prior_state.block_value_off'
      )
      break
    case 'blockTargetTemp':
      blockValueText = t(
        'protocol_steps:thermocycler_module.prior_state.block_value',
        {
          value: currentBlockActivity.blockTargetTemp,
        }
      )
      break
    default:
      currentBlockActivity satisfies never
  }

  return (
    <StepFormStatusList>
      <StepFormStatus
        label={t('protocol_steps:thermocycler_module.prior_state.block_label')}
        value={blockValueText}
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
