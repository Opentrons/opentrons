import { useSelector } from 'react-redux'

import { getLocalRobotAuthState } from '/app/redux/robot-auth'

import type { State } from '/app/redux/types'

/**
 * Returns the initial to show in the account icon.
 *
 * If the user isn't currently logged in, returns `null`.
 */
export function useAccountIconInitial(): string | null {
  // todo(mm, 2026-04-29): This should be based on the legal name, not the username.
  // To do that, a user needs to be able to fetch `GET /auth/users/{username}` for
  // their own username, but that's currently an admin-only endpoint.`
  const currentUsername = useSelector(
    (state: State) => getLocalRobotAuthState(state)?.username ?? null
  )
  const firstChar = currentUsername?.[0]
  return firstChar != null ? firstChar.toLocaleUpperCase() : null
}
