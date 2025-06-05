import { useState } from 'react'

import { RECOVERY_MAP } from '../constants'

import type {
  ERUtilsProps,
  UseRecoveryRoutingResult,
  UseRouteUpdateActionsResult,
} from '../hooks'

export interface UseCleanupProps {
  isActiveUser: ERUtilsProps['isActiveUser']
  stashedMapRef: UseRouteUpdateActionsResult['stashedMapRef']
  setRM: UseRecoveryRoutingResult['setRM']
}

// When certain events (ex, someone terminates this app's recovery session) occur, reset state that needs to be reset.
export function useCleanupRecoveryState({
  isActiveUser,
  stashedMapRef,
  setRM,
}: UseCleanupProps): void {
  const [wasActiveUser, setWasActiveUser] = useState(false)

  if (isActiveUser && !wasActiveUser) {
    setWasActiveUser(true)
  } else if (!isActiveUser && wasActiveUser) {
    setWasActiveUser(false)

    stashedMapRef.current = null
    setRM({
      route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
      step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
    })
  }
}
