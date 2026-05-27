import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useSelfQuery } from '@opentrons/react-api-client'

import { getLocalRobot } from '/app/redux/discovery'
import { getLocalRobotAuthState, logOut } from '/app/redux/robot-auth'

import type { State } from '/app/redux/types'

interface UseAccountInfoResult {
  isLoggedIn: boolean
  /** null if not logged in. */
  username: string | null
  /** null if not logged in, data is still loading, or there was a load error. */
  fullName: string | null
}

/** Returns information about the currently logged-in account. */
export function useAccountInfo(): UseAccountInfoResult {
  const authState = useSelector(getLocalRobotAuthState)
  const username = authState?.username ?? null
  const isLoggedIn = username != null
  const query = useSelfQuery()
  const fullName = query.data?.data.fullName ?? null

  return useMemo(
    () => ({ isLoggedIn, username, fullName }),
    [isLoggedIn, username, fullName]
  )
}

/** Returns a function that logs out of the current account. */
export function useLogOut(): () => void {
  const dispatch = useDispatch()
  const localRobotName = useSelector(
    (state: State) => getLocalRobot(state)?.name ?? null
  )
  const logOutCallback = useCallback(() => {
    if (localRobotName == null) {
      console.warn("Couldn't determine the local robot.")
    } else {
      dispatch(
        logOut({
          robotName: localRobotName,
        })
      )
    }
  }, [dispatch, localRobotName])
  return logOutCallback
}
