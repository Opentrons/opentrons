import { RECOVERY_MAP } from '../constants'
import {
  HoldingLabware,
  ReleaseLabware,
  RetryStepInfo,
  StackerEmptyHopper,
  StackerEnsureShuttleEmpty,
  StackerHopperLwInfo,
  StackerReengageLatch,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function StackerShuttleEmptyRetry(
  props: RecoveryContentProps
): ReactNode {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { STACKER_SHUTTLE_EMPTY_RETRY } = RECOVERY_MAP

  switch (step) {
    case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.EMPTY_STACKER:
      return <StackerEmptyHopper {...props} />
    case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.CONFIRM_LABWARE_IN_LATCH:
      return <HoldingLabware {...props} />
    case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.RELEASE_FROM_LATCH:
      return <ReleaseLabware {...props} />
    case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.REENGAGE_LATCH:
      return <StackerReengageLatch {...props} />
    case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.FILL_HOPPER:
      return <StackerHopperLwInfo {...props} />
    case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.ENSURE_SHUTTLE_EMPTY:
      return <StackerEnsureShuttleEmpty {...props} />
    case STACKER_SHUTTLE_EMPTY_RETRY.STEPS.RETRY:
      return <RetryStepInfo {...props} />
    default:
      console.warn(
        `StackerShuttleEmptyRetry: ${step} in ${route} not explicitly handled. Rerouting.`
      )
      return <SelectRecoveryOption {...props} />
  }
}
