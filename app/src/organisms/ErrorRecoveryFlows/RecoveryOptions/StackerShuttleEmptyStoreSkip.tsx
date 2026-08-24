import { RECOVERY_MAP } from '../constants'
import {
  SkipStepInfo,
  StackerEnsureShuttleEmpty,
  StackerHomeShuttle,
  StackerHopperLwInfo,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function StackerShuttleEmptyStoreSkip(
  props: RecoveryContentProps
): ReactNode {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { STACKER_SHUTTLE_EMPTY_STORE_SKIP } = RECOVERY_MAP

  switch (step) {
    case STACKER_SHUTTLE_EMPTY_STORE_SKIP.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
      return <StackerHomeShuttle {...props} />
    case STACKER_SHUTTLE_EMPTY_STORE_SKIP.STEPS.CHECK_HOPPER:
      return <StackerHopperLwInfo {...props} />
    case STACKER_SHUTTLE_EMPTY_STORE_SKIP.STEPS.ENSURE_SHUTTLE_EMPTY:
      return <StackerEnsureShuttleEmpty {...props} />
    case STACKER_SHUTTLE_EMPTY_STORE_SKIP.STEPS.SKIP:
      return <SkipStepInfo {...props} />
    default:
      console.warn(
        `StackerShuttleEmptyStoreSkip: ${step} in ${route} not explicitly handled. Rerouting.`
      )
      return <SelectRecoveryOption {...props} />
  }
}
