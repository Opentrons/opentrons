import { RECOVERY_MAP } from '../constants'
import {
  SkipStepInfo,
  StackerHomeShuttle,
  StackerHopperLwInfo,
  StackerShuttleLwInfo,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { RecoveryContentProps } from '../types'

export function StackerStalledSkip(props: RecoveryContentProps): JSX.Element {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { STACKER_STALLED_SKIP } = RECOVERY_MAP

  const buildUnexpectedStep = (): JSX.Element => {
    console.warn(
      `StackerStalledSkip: ${step} in ${route} not explicitly handled. Rerouting.`
    )
    return <SelectRecoveryOption {...props} />
  }

  const buildContent = (): JSX.Element => {
    switch (step) {
      case STACKER_STALLED_SKIP.STEPS.PREPARE_TRACK_FOR_HOMING:
      case STACKER_STALLED_SKIP.STEPS.CLEAR_TRACK_OF_OBSTRUCTIONS:
        return <StackerHomeShuttle {...props} />
      case STACKER_STALLED_SKIP.STEPS.PLACE_LABWARE_ON_SHUTTLE:
        return <StackerShuttleLwInfo {...props} />
      case STACKER_STALLED_SKIP.STEPS.CHECK_HOPPER:
        return <StackerHopperLwInfo {...props} />
      case STACKER_STALLED_SKIP.STEPS.SKIP:
        return <SkipStepInfo {...props} />
      default:
        return buildUnexpectedStep()
    }
  }

  return buildContent()
}
