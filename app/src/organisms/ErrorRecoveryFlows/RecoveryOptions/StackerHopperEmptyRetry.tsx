import { RECOVERY_MAP } from '../constants'
import {
  RetryStepInfo,
  StackerEnsureShuttleEmpty,
  StackerHopperLwInfo,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function StackerHopperEmptyRetry(
  props: RecoveryContentProps
): ReactNode {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { STACKER_HOPPER_EMPTY_RETRY } = RECOVERY_MAP

  switch (step) {
    case STACKER_HOPPER_EMPTY_RETRY.STEPS.FILL_HOPPER:
      return <StackerHopperLwInfo {...props} />
    case STACKER_HOPPER_EMPTY_RETRY.STEPS.ENSURE_SHUTTLE_EMPTY:
      return <StackerEnsureShuttleEmpty {...props} />
    case STACKER_HOPPER_EMPTY_RETRY.STEPS.RETRY:
      return <RetryStepInfo {...props} />
    default:
      console.warn(
        `StackerHopperEmptyRetry: ${step} in ${route} not explicitly handled. Rerouting.`
      )
      return <SelectRecoveryOption {...props} />
  }
}
