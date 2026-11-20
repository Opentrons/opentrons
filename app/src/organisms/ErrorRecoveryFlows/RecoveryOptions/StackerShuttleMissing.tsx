import { RECOVERY_MAP } from '../constants'
import {
  RetryStepInfo,
  StackerEnsureShuttleEmpty,
  StackerHomeShuttle,
  StackerHopperLwInfo,
  StackerLoadShuttle,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function StackerShuttleMissing(props: RecoveryContentProps): ReactNode {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { STACKER_SHUTTLE_MISSING_RETRY } = RECOVERY_MAP

  switch (step) {
    case STACKER_SHUTTLE_MISSING_RETRY.STEPS.PREPARE_TRACK_FOR_HOMING:
      return <StackerHomeShuttle {...props} />
    case STACKER_SHUTTLE_MISSING_RETRY.STEPS.LOAD_SHUTTLE:
      return <StackerLoadShuttle {...props} />
    case STACKER_SHUTTLE_MISSING_RETRY.STEPS.CHECK_HOPPER:
      return <StackerHopperLwInfo {...props} />
    case STACKER_SHUTTLE_MISSING_RETRY.STEPS.ENSURE_SHUTTLE_EMPTY:
      return <StackerEnsureShuttleEmpty {...props} />
    case STACKER_SHUTTLE_MISSING_RETRY.STEPS.RETRY:
      return <RetryStepInfo {...props} />
    default:
      console.warn(
        `StackerShuttleMissing: ${step} in ${route} not explicitly handled. Rerouting.`
      )
      return <SelectRecoveryOption {...props} />
  }
}
