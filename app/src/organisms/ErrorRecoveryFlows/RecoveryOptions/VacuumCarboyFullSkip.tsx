import { RECOVERY_MAP } from '../constants'
import {
  SkipStepInfo,
  VacuumDisconnectEmptyCarboy,
  VacuumReconnectWasteTube,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function VacuumCarboyFullSkip(props: RecoveryContentProps): ReactNode {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { VACUUM_CARBOY_FULL_SKIP } = RECOVERY_MAP

  switch (step) {
    case VACUUM_CARBOY_FULL_SKIP.STEPS.DISCONNECT_AND_EMPTY_CARBOY:
      return <VacuumDisconnectEmptyCarboy {...props} />
    case VACUUM_CARBOY_FULL_SKIP.STEPS.RECONNECT_WASTE_TUBE:
      return <VacuumReconnectWasteTube {...props} />
    case VACUUM_CARBOY_FULL_SKIP.STEPS.SKIP:
      return <SkipStepInfo {...props} />
    default:
      console.warn(
        `VacuumCarboyFullSkip: ${step} in ${route} not explicitly handled. Rerouting.`
      )
      return <SelectRecoveryOption {...props} />
  }
}
