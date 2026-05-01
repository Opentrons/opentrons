import { useCallback } from 'react'

import { showLoginNiceModal } from '/app/organisms/ODD/OnDeviceLogin'

export interface RequireLoginResult {
  username: string
}

export type RequireLoginGuard = () => Promise<RequireLoginResult | null>

/**
 * Guard hook that ensures a user is authenticated.
 *
 * The current username is passed in by the caller — this hook does not read
 * Redux directly so it stays focused on the login UX (modal + result).
 *
 * Assumes access control is enabled — the caller (`useGuardedAction`) is
 * responsible for short-circuiting when access control is off.
 *
 * Resolves with `{ username }` if the user is logged in (already or via the
 * modal). Resolves to `null` if the user dismisses the login modal.
 */
export function useRequireLogin(
  currentUsername: string | null
): RequireLoginGuard {
  return useCallback(async () => {
    if (currentUsername != null) {
      return { username: currentUsername }
    }
    const result = await showLoginNiceModal()
    if (result == null) return null
    return { username: result.username }
  }, [currentUsername])
}
