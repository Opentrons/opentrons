import { RECOVERY_MAP } from '../constants'
import {
  HoldingLabware,
  ReleaseLabware,
  RetryStepInfo,
  StackerEmptyHopper,
  StackerEnsureShuttleEmpty,
  StackerHopperLwInfo,
  StackerReengageLatch,
  StackerShuttleLwInfo,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { RecoveryContentProps } from '../types'

export function StackerShuttleEmptyStoreRetry(
  props: RecoveryContentProps
): JSX.Element {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { STACKER_SHUTTLE_EMPTY_STORE_RETRY } = RECOVERY_MAP

  switch (step) {
    case STACKER_SHUTTLE_EMPTY_STORE_RETRY.STEPS.CHECK_HOPPER:
      return <StackerHopperLwInfo {...props} />
    case STACKER_SHUTTLE_EMPTY_STORE_RETRY.STEPS.PLACE_LABWARE_ON_SHUTTLE:
      return <StackerShuttleLwInfo {...props} />
    case STACKER_SHUTTLE_EMPTY_STORE_RETRY.STEPS.RETRY:
      return <RetryStepInfo {...props} />
    default:
      console.warn(
        `StackerShuttleEmptyStoreRetry: ${step} in ${route} not explicitly handled. Rerouting.`
      )
      return <SelectRecoveryOption {...props} />
  }
}
