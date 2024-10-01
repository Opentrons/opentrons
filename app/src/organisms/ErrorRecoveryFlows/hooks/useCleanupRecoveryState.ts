import { useEffect } from 'react'

import { RECOVERY_MAP } from '../constants'

import type {
  ERUtilsProps,
  UseRouteUpdateActionsResult,
  UseRecoveryRoutingResult,
} from '../hooks'

export interface UseCleanupProps {
  isTakeover: ERUtilsProps['showTakeover']
  stashedMapRef: UseRouteUpdateActionsResult['stashedMapRef']
  setRM: UseRecoveryRoutingResult['setRM']
}

// When certain events (ex, a takeover) occur, reset state that needs to be reset.
export function useCleanupRecoveryState({
  isTakeover,
  stashedMapRef,
  setRM,
}: UseCleanupProps): void {
  useEffect(() => {
    if (isTakeover) {
      stashedMapRef.current = null

      setRM({
        route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
        step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
      })
    }
  }, [isTakeover])
}
