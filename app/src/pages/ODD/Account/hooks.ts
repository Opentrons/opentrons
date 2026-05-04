import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { getLocalRobot } from '/app/redux/discovery'
import { getLocalRobotAuthState, logOutOrTimeOut } from '/app/redux/robot-auth'

import type { State } from '/app/redux/types'

interface UseAccountInfoResult {
  isLoggedIn: boolean
  /** null if not logged in. */
  username: string | null
  /** null if not logged in or the info is still loading. */
  legalName: string | null
}

/** Returns information about the currently logged-in account. */
export function useAccountInfo(): UseAccountInfoResult {
  const authState = useSelector(getLocalRobotAuthState)
  const isLoggedIn = authState != null
  const username = authState?.username ?? null
  // todo(mm, 2026-05-01): This is a placeholder. Get the actual legal name once
  // https://opentrons.atlassian.net/browse/EXEC-2610 is resolved and react-api-client
  // can send requests with auth tokens.
  const legalName = username
  return useMemo(
    () => ({ isLoggedIn, username, legalName }),
    [isLoggedIn, username, legalName]
  )
}

/** Returns a function that logs out of the current account. */
export function useLogOut(): () => void {
  const dispatch = useDispatch()
  const localRobotName = useSelector(
    (state: State) => getLocalRobot(state)?.name ?? null
  )
  const logOut = useCallback(() => {
    if (localRobotName == null) {
      console.warn("Couldn't determine the local robot.")
    } else {
      dispatch(
        logOutOrTimeOut({
          robotName: localRobotName,
        })
      )
    }
  }, [dispatch, localRobotName])
  return logOut
}
