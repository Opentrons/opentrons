import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { getCurrentUsernameForLocalRobot } from '/app/redux/robot-auth'
import { showLoginNiceModal } from '/app/organisms/ODD/OnDeviceLogin'

export interface RequireLoginResult {
  username: string | null
}

export type RequireLoginGuard = () => Promise<RequireLoginResult | null>

/**
 * Guard hook that ensures a user is authenticated before an action proceeds.
 *
 * Returns `null` if the user dismisses the login modal without logging in.
 */
export function useRequireLogin(): RequireLoginGuard {
  const accessControlEnabledQuery = useAccessControlEnabledQuery()
  const currentUsername = useSelector(getCurrentUsernameForLocalRobot)
  const accessControlEnabled =
    accessControlEnabledQuery?.data?.data?.accessControlEnabled ?? false

  return useCallback(async () => {
    if (!accessControlEnabled) {
      return { username: null }
    }
    if (currentUsername != null) {
      return { username: currentUsername }
    }
    const result = await showLoginNiceModal()
    if (result == null) return null
    return { username: result.username }
  }, [accessControlEnabled, currentUsername])
}
