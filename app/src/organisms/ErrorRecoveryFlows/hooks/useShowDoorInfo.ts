import * as React from 'react'

import {
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
} from '@opentrons/api-client'

import { RECOVERY_MAP_METADATA } from '../constants'

import type { RunStatus } from '@opentrons/api-client'
import type { ErrorRecoveryFlowsProps } from '../index'
import type { IRecoveryMap } from '../types'

const DOOR_OPEN_STATUSES: RunStatus[] = [
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
]

// Whether the door is open or the user has not yet resumed the run after a door open event.
export function useShowDoorInfo(
  runStatus: ErrorRecoveryFlowsProps['runStatus'],
  recoveryMap: IRecoveryMap
): boolean {
  const [showDoorModal, setShowDoorModal] = React.useState(false)

  React.useEffect(() => {
    // TODO(jh, 07-16-24): "recovery paused" is only used for door status and therefore
    // a valid way to ensure all apps show the door open prompt, however this could be problematic in the future.
    // Consider restructuring this check once the takeover modals are added.

    const result = !isDoorPermittedOpen(recoveryMap)
    console.log('=>(useShowDoorInfo.ts:32) result', result)

    if (
      runStatus != null &&
      DOOR_OPEN_STATUSES.includes(runStatus) &&
      !isDoorPermittedOpen(recoveryMap)
    ) {
      setShowDoorModal(true)
    } else if (
      showDoorModal &&
      runStatus != null &&
      !DOOR_OPEN_STATUSES.includes(runStatus)
    ) {
      setShowDoorModal(false)
    }
  }, [runStatus, showDoorModal])

  return showDoorModal
}

export function isDoorPermittedOpen(recoveryMap: IRecoveryMap): boolean {
  const { route, step } = recoveryMap

  if (route in RECOVERY_MAP_METADATA) {
    const routeConfig = RECOVERY_MAP_METADATA[route]

    if (step in routeConfig) {
      // @ts-expect-error Overly nested type that TS struggles to infer.
      return routeConfig[step].allowDoorOpen
    }
  }

  console.error(
    'Unexpected route/step combination when attempting to get door metadata for recovery map: ',
    recoveryMap
  )
  return false
}
