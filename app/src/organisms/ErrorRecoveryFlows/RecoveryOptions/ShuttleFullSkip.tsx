import { RECOVERY_MAP } from '../constants'
import {
  SkipStepInfo,
  StackerEmptyHopper,
  StackerHomeShuttle,
  StackerHopperLwInfo,
  StackerShuttleLwInfo,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function ShuttleFullSkip(props: RecoveryContentProps): ReactNode {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { SHUTTLE_FULL_SKIP } = RECOVERY_MAP

  switch (step) {
    case SHUTTLE_FULL_SKIP.STEPS.EMPTY_STACKER:
      return <StackerEmptyHopper {...props} />
    case SHUTTLE_FULL_SKIP.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
      return <StackerHomeShuttle {...props} />
    case SHUTTLE_FULL_SKIP.STEPS.PLACE_LABWARE_ON_SHUTTLE:
      return <StackerShuttleLwInfo {...props} />
    case SHUTTLE_FULL_SKIP.STEPS.CHECK_HOPPER:
      return <StackerHopperLwInfo {...props} />
    case SHUTTLE_FULL_SKIP.STEPS.SKIP:
      return <SkipStepInfo {...props} />
    default:
      console.warn(
        `StackerStalledSkip: ${step} in ${route} not explicitly handled. Rerouting.`
      )
      return <SelectRecoveryOption {...props} />
  }
}
