import { RECOVERY_MAP } from '../constants'
import {
  RetryStepInfo,
  StackerEmptyHopper,
  StackerHomeShuttle,
  StackerHopperLwInfo,
  StackerShuttleLwInfo,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function StackerStalledStoreRetry(
  props: RecoveryContentProps
): ReactNode {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { STACKER_STALLED_STORE_RETRY } = RECOVERY_MAP

  switch (step) {
    case STACKER_STALLED_STORE_RETRY.STEPS.EMPTY_STACKER:
      return <StackerEmptyHopper {...props} />
    case STACKER_STALLED_STORE_RETRY.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
      return <StackerHomeShuttle {...props} />
    case STACKER_STALLED_STORE_RETRY.STEPS.CHECK_HOPPER:
      return <StackerHopperLwInfo {...props} />
    case STACKER_STALLED_STORE_RETRY.STEPS.RETRY:
      return <RetryStepInfo {...props} />
    case STACKER_STALLED_STORE_RETRY.STEPS.PLACE_LABWARE_ON_SHUTTLE:
      return <StackerShuttleLwInfo {...props} />
    default:
      console.warn(
        `StackerStalledStoreRetry: ${step} in ${route} not explicitly handled. Rerouting.`
      )
      return <SelectRecoveryOption {...props} />
  }
}
