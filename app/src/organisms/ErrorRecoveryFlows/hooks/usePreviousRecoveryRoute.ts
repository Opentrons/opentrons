import * as React from 'react'

import type { RecoveryRoute } from '../types'

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
