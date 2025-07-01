import { RECOVERY_MAP } from '../constants'
import { RetryStepInfo, StackerHopperLwInfo } from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { RecoveryContentProps } from '../types'

export function StackerHopperEmptyRetry(
  props: RecoveryContentProps
): JSX.Element {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { STACKER_HOPPER_EMPTY_RETRY } = RECOVERY_MAP

  const buildUnexpectedStep = (): JSX.Element => {
    console.warn(
      `StackerHopperEmptyRetry: ${step} in ${route} not explicitly handled. Rerouting.`
    )
    return <SelectRecoveryOption {...props} />
  }

  const buildContent = (): JSX.Element => {
    switch (step) {
      case STACKER_HOPPER_EMPTY_RETRY.STEPS.FILL_HOPPER:
        return <StackerHopperLwInfo {...props} />
      case STACKER_HOPPER_EMPTY_RETRY.STEPS.RETRY:
        return <RetryStepInfo {...props} />
      default:
        return buildUnexpectedStep()
    }
  }

  return buildContent()
}
