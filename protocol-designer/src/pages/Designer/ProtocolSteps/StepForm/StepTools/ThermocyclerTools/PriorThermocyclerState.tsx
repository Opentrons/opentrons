import { useTranslation } from 'react-i18next'

import {
  StepFormStatus,
  StepFormStatusList,
} from '/protocol-designer/components/molecules'

import type { ReactNode } from 'react'
import type { ThermocyclerModuleState } from '@opentrons/step-generation'

export function PriorThermocyclerState(props: {
  priorState: ThermocyclerModuleState
}): ReactNode {
  const { currentBlockActivity, lidTargetTemp, lidOpen } = props.priorState
  const { t } = useTranslation()

  let blockValueText
  switch (currentBlockActivity.type) {
    case 'blockDeactivated':
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
    case 'profile':
      // We can only get here if the user is trying to construct an invalid timeline,
      // trying to do something new with a Thermocycler while it already has a profile
      // ongoing.
      //
      // We're saying the block is "off" because we lack more specialized copy.
      blockValueText = t(
        'protocol_steps:thermocycler_module.prior_state.block_value_off'
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
