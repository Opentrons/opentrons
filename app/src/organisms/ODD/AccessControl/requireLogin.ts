import { fetchSelfQuery } from '@opentrons/react-api-client'

import { showLoginModal } from '/app/organisms/ODD/OnDeviceLogin/LoginModal'

import type { QueryClient } from 'react-query'
import type { HostConfig } from '@opentrons/api-client'

export interface RequireLoginResult {
  username: string
}

/**
 * Guard that ensures a user is authenticated.
 *
 * If `currentUsername` is non-null and `GET /auth/users/self` does not report
 * `resetPassword: true`, the user is already logged in and the function resolves
 * immediately. Otherwise it opens the login modal (including when the user must
 * set a new password after a reset) and resolves with the entered username, or
 * `null` if the user dismisses.
 */
export async function requireLogin(
  queryClient: QueryClient,
  currentUsername: string | null,
  hostConfig: HostConfig | null
): Promise<RequireLoginResult | null> {
  const shouldShowLogin =
    currentUsername == null ||
    (await isPasswordResetRequired(queryClient, hostConfig))

  if (!shouldShowLogin) {
    return { username: currentUsername }
  }

  const result = await showLoginModal()
  if (result == null) return null
  return { username: result }
}

async function isPasswordResetRequired(
  queryClient: QueryClient,
  hostConfig: HostConfig | null
): Promise<boolean> {
  if (hostConfig?.token == null) return false

  try {
    const self = await fetchSelfQuery(queryClient, hostConfig)
    return self.data.resetPassword
  } catch {
    return false
  }
}
