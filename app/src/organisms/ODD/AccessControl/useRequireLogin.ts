import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import { getCurrentUsernameForLocalRobot } from '/app/redux/robot-auth'
import { showLoginNiceModal } from '/app/organisms/ODD/OnDeviceLogin'

export interface RequireLoginResult {
  username: string
}

export type RequireLoginGuard = () => Promise<RequireLoginResult | null>

/**
 * Guard hook that ensures a user is authenticated.
 *
 * Assumes access control is enabled.
 *
 * Resolves with `{ username }` if the user is logged in (already or via the
 * modal). Resolves to `null` if the user dismisses the login modal.
 */
export function useRequireLogin(): RequireLoginGuard {
  const currentUsername = useSelector(getCurrentUsernameForLocalRobot)

  return useCallback(async () => {
    if (currentUsername != null) {
      return { username: currentUsername }
    }
    const result = await showLoginNiceModal()
    if (result == null) return null
    return { username: result.username }
  }, [currentUsername])
}
