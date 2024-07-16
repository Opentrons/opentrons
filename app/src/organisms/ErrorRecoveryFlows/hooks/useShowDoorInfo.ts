import * as React from 'react'

import {
  RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR,
  RUN_STATUS_AWAITING_RECOVERY_PAUSED,
} from '@opentrons/api-client'

import type { ErrorRecoveryFlowsProps } from '../index'

// Whether the door is open or the user has not yet resumed the run after a door open event.
export function useShowDoorInfo(
  runStatus: ErrorRecoveryFlowsProps['runStatus']
): boolean {
  const [showDoorModal, setShowDoorModal] = React.useState(false)

  React.useEffect(() => {
    if (runStatus === RUN_STATUS_AWAITING_RECOVERY_BLOCKED_BY_OPEN_DOOR) {
      setShowDoorModal(true)
    } else if (
      showDoorModal &&
      runStatus !== RUN_STATUS_AWAITING_RECOVERY_PAUSED
    ) {
      setShowDoorModal(false)
    }
  }, [runStatus, showDoorModal])

  return showDoorModal
}
