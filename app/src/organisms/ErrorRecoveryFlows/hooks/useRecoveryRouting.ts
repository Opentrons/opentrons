import * as React from 'react'

import { RECOVERY_MAP } from '../constants'

import type { IRecoveryMap, RecoveryRoute } from '../types'
import type { ERUtilsResults } from './useERUtils'

/**
 * ER Wizard routing. Also provides access to the routing of any other flow launched from ER.
 * Recovery Route: A logically-related collection of recovery steps or a single step if unrelated to any existing recovery route.
 * Recovery Step: Analogous to a "step" in other wizard flows.
 *
 * @params {trackExternalStep} Used to keep track of the current step in other flows launched from Error Recovery, ex. Drop Tip flows.
 */

export function useRecoveryRouting(): {
  recoveryMap: IRecoveryMap
  previousRoute: RecoveryRoute | null
  setRM: (map: IRecoveryMap) => void
  trackExternalMap: ERUtilsResults['trackExternalMap']
} {
  const [recoveryMap, setRecoveryMap] = React.useState<IRecoveryMap>({
    route: RECOVERY_MAP.OPTION_SELECTION.ROUTE,
    step: RECOVERY_MAP.OPTION_SELECTION.STEPS.SELECT,
  })

  // If we do multi-app routing, concat the sub-step to the error recovery routing.
  const [, setSubMap] = React.useState<Record<string, any> | null>(null)

  const previousRoute = usePreviousRecoveryRoute(recoveryMap.route)

  return {
    recoveryMap,
    previousRoute,
    setRM: setRecoveryMap,
    trackExternalMap: setSubMap,
  }
}

// The previous recovery route visited before the current route, if any.
export function usePreviousRecoveryRoute(
  route: RecoveryRoute
): RecoveryRoute | null {
  const [prevRoute, setPrevRoute] = React.useState<RecoveryRoute | null>(null)
  const [currentRoute, setCurrentRoute] = React.useState<RecoveryRoute>(route)

  if (route !== currentRoute) {
    setPrevRoute(currentRoute)
    setCurrentRoute(route)
  }

  return prevRoute
}
