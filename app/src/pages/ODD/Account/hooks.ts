import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { useSelfQuery } from '@opentrons/react-api-client'

import { getLocalRobotAuthState } from '/app/redux/robot-auth'

interface UseAccountInfoResult {
  isLoggedIn: boolean
  /** null if not logged in. */
  username: string | null
  /** null if not logged in, data is still loading, or there was a load error. */
  fullName: string | null
}

/** Returns information about the currently logged-in account of the current robot. */
export function useAccountInfo(): UseAccountInfoResult {
  const authState = useSelector(getLocalRobotAuthState)
  const username = authState?.user.username ?? null
  const isLoggedIn = username != null
  const query = useSelfQuery()
  const fullName = query.data?.data.fullName ?? null

  return useMemo(
    () => ({ isLoggedIn, username, fullName }),
    [isLoggedIn, username, fullName]
  )
}
