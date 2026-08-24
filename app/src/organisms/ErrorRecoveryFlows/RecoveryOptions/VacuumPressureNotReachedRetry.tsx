import { RECOVERY_MAP } from '../constants'
import {
  RetryStepInfo,
  VacuumCheckCollar,
  VacuumCheckTubeConnections,
} from '../shared'
import { SelectRecoveryOption } from './SelectRecoveryOption'

import type { ReactNode } from 'react'
import type { RecoveryContentProps } from '../types'

export function VacuumPressureNotReachedRetry(
  props: RecoveryContentProps
): ReactNode {
  const { recoveryMap } = props
  const { step, route } = recoveryMap
  const { VACUUM_PRESSURE_NOT_REACHED_RETRY } = RECOVERY_MAP

  switch (step) {
    case VACUUM_PRESSURE_NOT_REACHED_RETRY.STEPS.CHECK_COLLAR:
      return <VacuumCheckCollar {...props} />
    case VACUUM_PRESSURE_NOT_REACHED_RETRY.STEPS.CHECK_TUBE_CONNECTIONS:
      return <VacuumCheckTubeConnections {...props} />
    case VACUUM_PRESSURE_NOT_REACHED_RETRY.STEPS.RETRY:
      return <RetryStepInfo {...props} />
    default:
      console.warn(
        `VacuumPressureNotReachedRetry: ${step} in ${route} not explicitly handled. Rerouting.`
      )
      return <SelectRecoveryOption {...props} />
  }
}
