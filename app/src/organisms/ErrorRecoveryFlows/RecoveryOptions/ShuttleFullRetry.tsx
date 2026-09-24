import { RECOVERY_MAP } from '../constants'
import {
  RetryStepInfo,
  StackerEmptyHopper,
  StackerEnsureShuttleEmpty,
  StackerHomeShuttle,
  StackerHopperLwInfo,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function ShuttleFullRetry(props: RecoveryContentProps): ReactNode {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { SHUTTLE_FULL_RETRY } = RECOVERY_MAP

  switch (step) {
    case SHUTTLE_FULL_RETRY.STEPS.EMPTY_STACKER:
      return <StackerEmptyHopper {...props} />
    case SHUTTLE_FULL_RETRY.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
      return <StackerHomeShuttle {...props} />
    case SHUTTLE_FULL_RETRY.STEPS.CHECK_HOPPER:
      return <StackerHopperLwInfo {...props} />
    case SHUTTLE_FULL_RETRY.STEPS.RETRY:
      return <RetryStepInfo {...props} />
    case SHUTTLE_FULL_RETRY.STEPS.ENSURE_SHUTTLE_EMPTY:
      return <StackerEnsureShuttleEmpty {...props} />
    default:
      console.warn(
        `ShuttleFullRetry: ${step} in ${route} not explicitly handled. Rerouting.`
      )
      return <SelectRecoveryOption {...props} />
  }
}
