import { RECOVERY_MAP } from '../constants'
import {
  HoldingLabware,
  RecoveryDoorOpenSpecial,
  ReleaseLabware,
  RetryStepInfo,
  TwoColLwInfoAndDeck,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function ManualReplaceLwAndRetry(
  props: RecoveryContentProps
): ReactNode {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { MANUAL_REPLACE_AND_RETRY } = RECOVERY_MAP

  switch (step) {
    case MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_HOLDING_LABWARE:
      return <HoldingLabware {...props} />
    case MANUAL_REPLACE_AND_RETRY.STEPS.GRIPPER_RELEASE_LABWARE:
      return <ReleaseLabware {...props} />
    case MANUAL_REPLACE_AND_RETRY.STEPS.CLOSE_DOOR_GRIPPER_Z_HOME:
      return <RecoveryDoorOpenSpecial {...props} />
    case MANUAL_REPLACE_AND_RETRY.STEPS.MANUAL_REPLACE:
      return <TwoColLwInfoAndDeck {...props} />
    case MANUAL_REPLACE_AND_RETRY.STEPS.RETRY:
      return <RetryStepInfo {...props} />
    default:
      console.warn(
        `ManualReplaceLwAndRetry: ${step} in ${route} not explicitly handled. Rerouting.`
      )
      return <SelectRecoveryOption {...props} />
  }
}
