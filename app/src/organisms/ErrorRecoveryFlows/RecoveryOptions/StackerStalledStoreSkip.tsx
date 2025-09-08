import { RECOVERY_MAP } from '../constants'
import {
  SkipStepInfo,
  StackerEmptyHopper,
  StackerEnsureShuttleEmpty,
  StackerHomeShuttle,
  StackerHopperLwInfo,
  StackerShuttleLwInfo,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { RecoveryContentProps } from '../types'

export function StackerStalledStoreSkip(props: RecoveryContentProps): JSX.Element {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { STACKER_STALLED_STORE_SKIP } = RECOVERY_MAP
  console.log('STACKER_STALLED_STORE_SKIP', STACKER_STALLED_STORE_SKIP)
  console.log('step', step)
  console.log('route', route)
  switch (step) {
    case STACKER_STALLED_STORE_SKIP.STEPS.EMPTY_STACKER:
      return <StackerEmptyHopper {...props} />
    case STACKER_STALLED_STORE_SKIP.STEPS.PREPARE_TRACK_FOR_HOMING:
    case STACKER_STALLED_STORE_SKIP.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
      return <StackerHomeShuttle {...props} />
    case STACKER_STALLED_STORE_SKIP.STEPS.ENSURE_SHUTTLE_EMPTY:
      return <StackerEnsureShuttleEmpty {...props} />
    case STACKER_STALLED_STORE_SKIP.STEPS.CHECK_HOPPER:
      return <StackerHopperLwInfo {...props} />
    case STACKER_STALLED_STORE_SKIP.STEPS.SKIP:
      return <SkipStepInfo {...props} />
    default:
      console.warn(
        `StackerStalledStoreSkip: ${step} in ${route} not explicitly handled. Rerouting.`
      )
      return <SelectRecoveryOption {...props} />
  }
}
