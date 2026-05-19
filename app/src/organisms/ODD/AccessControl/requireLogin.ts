import { showLoginModal } from '/app/organisms/ODD/OnDeviceLogin/LoginModal'

export interface RequireLoginResult {
  username: string
}

/**
 * Guard that ensures a user is authenticated.
 *
 * If `currentUsername` is non-null the user is already logged in and the
 * function resolves immediately. Otherwise it opens the login modal and
 * resolves with the entered username, or `null` if the user dismisses.
 */
export async function requireLogin(
  currentUsername: string | null
): Promise<RequireLoginResult | null> {
  if (currentUsername != null) {
    return { username: currentUsername }
  }
  const result = await showLoginModal()
  if (result == null) return null
  return { username: result.username }
}
