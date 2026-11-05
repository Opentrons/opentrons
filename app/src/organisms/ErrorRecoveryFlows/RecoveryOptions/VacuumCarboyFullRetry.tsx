import { RECOVERY_MAP } from '../constants'
import {
  RetryStepInfo,
  VacuumDisconnectEmptyCarboy,
  VacuumReconnectWasteTube,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function VacuumCarboyFullRetry(props: RecoveryContentProps): ReactNode {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { VACUUM_CARBOY_FULL_RETRY } = RECOVERY_MAP

  switch (step) {
    case VACUUM_CARBOY_FULL_RETRY.STEPS.DISCONNECT_AND_EMPTY_CARBOY:
      return <VacuumDisconnectEmptyCarboy {...props} />
    case VACUUM_CARBOY_FULL_RETRY.STEPS.RECONNECT_WASTE_TUBE:
      return <VacuumReconnectWasteTube {...props} />
    case VACUUM_CARBOY_FULL_RETRY.STEPS.RETRY:
      return <RetryStepInfo {...props} />
    default:
      console.warn(
        `VacuumCarboyFullRetry: ${step} in ${route} not explicitly handled. Rerouting.`
      )
      return <SelectRecoveryOption {...props} />
  }
}
