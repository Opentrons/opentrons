import { RECOVERY_MAP } from '../constants'
import {
  SkipStepInfo,
  StackerHopperLwInfo,
  StackerShuttleLwInfo,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { RecoveryContentProps } from '../types'

export function StackerHopperEmptySkip(
  props: RecoveryContentProps
): JSX.Element {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { STACKER_HOPPER_EMPTY_SKIP } = RECOVERY_MAP

  const buildUnexpectedStep = (): JSX.Element => {
    console.warn(
      `StackerHopperEmptySkip: ${step} in ${route} not explicitly handled. Rerouting.`
    )
    return <SelectRecoveryOption {...props} />
  }

  const buildContent = (): JSX.Element => {
    switch (step) {
      case STACKER_HOPPER_EMPTY_SKIP.STEPS.PLACE_LABWARE_ON_SHUTTLE:
        return <StackerShuttleLwInfo {...props} />
      case STACKER_HOPPER_EMPTY_SKIP.STEPS.FILL_HOPPER:
        return <StackerHopperLwInfo {...props} />
      case STACKER_HOPPER_EMPTY_SKIP.STEPS.SKIP:
        return <SkipStepInfo {...props} />
      default:
        return buildUnexpectedStep()
    }
  }

  return buildContent()
}
