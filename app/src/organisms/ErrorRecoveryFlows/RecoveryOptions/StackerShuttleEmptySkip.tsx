import { RECOVERY_MAP } from '../constants'
import {
  HoldingLabware,
  ReleaseLabware,
  RetryStepInfo,
  SkipStepInfo,
  StackerEmptyHopper,
  StackerHomeShuttle,
  StackerHopperLwInfo,
  StackerReengageLatch,
  StackerShuttleLwInfo,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { RecoveryContentProps } from '../types'

export function StackerShuttleEmptySkip(
  props: RecoveryContentProps
): JSX.Element {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { STACKER_SHUTTLE_EMPTY_SKIP } = RECOVERY_MAP

  const buildUnexpectedStep = (): JSX.Element => {
    console.warn(
      `StackerShuttleEmptySkip: ${step} in ${route} not explicitly handled. Rerouting.`
    )
    return <SelectRecoveryOption {...props} />
  }

  const buildContent = (): JSX.Element => {
    switch (step) {
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.EMPTY_STACKER:
        return <StackerEmptyHopper {...props} />
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.PREPARE_TRACK_FOR_HOMING:
        return <StackerHomeShuttle {...props} />
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.CONFIRM_LABWARE_IN_LATCH:
        return <HoldingLabware {...props} />
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.RELEASE_FROM_LATCH:
        return <ReleaseLabware {...props} />
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.REENGAGE_LATCH:
        return <StackerReengageLatch {...props} />
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.PLACE_LABWARE_ON_SHUTTLE:
        return <StackerShuttleLwInfo {...props} />
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.FILL_HOPPER:
        return <StackerHopperLwInfo {...props} />
      case STACKER_SHUTTLE_EMPTY_SKIP.STEPS.SKIP:
        return <SkipStepInfo {...props} />
      default:
        return buildUnexpectedStep()
    }
  }

  return buildContent()
}
