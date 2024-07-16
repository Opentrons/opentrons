import * as React from 'react'

import {
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
} from '@opentrons/api-client'

import type { RunStatus } from '@opentrons/api-client'
import type { ErrorRecoveryFlowsProps } from '../index'

const DOOR_OPEN_STATUSES: RunStatus[] = [
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
]

// Whether the door is open or the user has not yet resumed the run after a door open event.
export function useShowDoorInfo(
  runStatus: ErrorRecoveryFlowsProps['runStatus']
): boolean {
  const [showDoorModal, setShowDoorModal] = React.useState(false)

  React.useEffect(() => {
    // TODO(jh, 07-16-24): "recovery paused" is only used for door status and therefore
    // a valid way to ensure all apps show the door open prompt, however this could be problematic in the future.
    // Consider restructuring this check once the takeover modals are added.
    if (runStatus != null && DOOR_OPEN_STATUSES.includes(runStatus)) {
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
