import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import { getAuthStateForRobot } from './slice'

import type { State } from '../types'

/** A convenience wrapper for the `getAccessTokenForRobot` selector. */
export function useAccessTokenForRobot(
  robotName: string | null
): string | null {
  const selector = useCallback(
    (state: State) => {
      if (robotName == null) {
        return null
      } else {
        return getAuthStateForRobot(state, robotName)?.accessToken ?? null
      }
    },
    [robotName]
  )
  return useSelector(selector)
}
