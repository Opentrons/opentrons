import { getSelf } from '@opentrons/api-client'

import { showLoginModal } from '/app/organisms/ODD/OnDeviceLogin/LoginModal'
import { getLocalRobot } from '/app/redux/discovery'
import { logOut } from '/app/redux/robot-auth'
import { store } from '/app/redux/store'

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
  currentUsername: string | null,
  hostConfig: HostConfig | null
): Promise<RequireLoginResult | null> {
  const shouldShowLogin =
    currentUsername == null || (await isPasswordResetRequired(hostConfig))

  if (!shouldShowLogin) {
    return { username: currentUsername }
  }

  if (currentUsername != null) {
    clearLocalLoginState()
  }

  const result = await showLoginModal()
  if (result == null) return null
  return { username: result.username }
}

function clearLocalLoginState(): void {
  const state = store.getState()
  const localRobotName = getLocalRobot(state)?.name ?? null
  if (localRobotName == null) {
    console.warn("Couldn't determine the local robot.")
    return
  }
  store.dispatch(logOut({ robotName: localRobotName }))
}

async function isPasswordResetRequired(
  hostConfig: HostConfig | null
): Promise<boolean> {
  if (hostConfig?.token == null) return false

  try {
    const response = await getSelf(hostConfig)
    return response.data.data.resetPassword
  } catch {
    return false
  }
}
