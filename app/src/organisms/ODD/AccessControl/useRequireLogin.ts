import { useCallback } from 'react'

import { showLoginModal } from '/app/organisms/ODD/OnDeviceLogin/LoginModal'

export interface RequireLoginResult {
  username: string
}

export type RequireLoginGuard = () => Promise<RequireLoginResult | null>

/**
 * Guard hook that ensures a user is authenticated.
 */
export function useRequireLogin(
  currentUsername: string | null
): RequireLoginGuard {
  return useCallback(async () => {
    if (currentUsername != null) {
      return { username: currentUsername }
    }
    const result = await showLoginModal()
    if (result == null) return null
    return { username: result.username }
  }, [currentUsername])
}
