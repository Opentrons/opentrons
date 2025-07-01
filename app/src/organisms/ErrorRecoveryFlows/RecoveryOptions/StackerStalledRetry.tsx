import { RECOVERY_MAP } from '../constants'
import {
  RetryStepInfo,
  StackerHomeShuttle,
  StackerHopperLwInfo,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { RecoveryContentProps } from '../types'

export function StackerStalledRetry(props: RecoveryContentProps): JSX.Element {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { STACKER_STALLED_RETRY } = RECOVERY_MAP

  const buildUnexpectedStep = (): JSX.Element => {
    console.warn(
      `StackerStalledRetry: ${step} in ${route} not explicitly handled. Rerouting.`
    )
    return <SelectRecoveryOption {...props} />
  }

  const buildContent = (): JSX.Element => {
    switch (step) {
      case STACKER_STALLED_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING:
      case STACKER_STALLED_RETRY.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
        return <StackerHomeShuttle {...props} />
      case STACKER_STALLED_RETRY.STEPS.CHECK_HOPPER:
        return <StackerHopperLwInfo {...props} />
      case STACKER_STALLED_RETRY.STEPS.RETRY:
        return <RetryStepInfo {...props} />
      default:
        return buildUnexpectedStep()
    }
  }

  return buildContent()
}
