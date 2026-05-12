import { useSelector } from 'react-redux'

import { getLocalRobotAuthState } from '/app/redux/robot-auth'

import type { State } from '/app/redux/types'

export type UseAccountIconInitialResult =
  | {
      showIcon: true
      iconContents: string
    }
  | {
      showIcon: false
      iconContents?: null | undefined
    }

/**
 * Returns what to show in the account icon, if anything.
 * (The first initial of the user's name.)
 */
export function useAccountIconInitial(): UseAccountIconInitialResult {
  // todo(mm, 2026-04-29): This should be based on the legal name, not the username.
  // To do that, a user needs to be able to fetch `GET /auth/users/{username}` for
  // their own username, but that's currently an admin-only endpoint.`
  const currentUsername = useSelector(
    (state: State) => getLocalRobotAuthState(state)?.username ?? null
  )
  if (currentUsername == null) {
    return { showIcon: false }
  } else {
    const firstChar = currentUsername[0] ?? ''
    return { showIcon: true, iconContents: firstChar.toLocaleUpperCase() }
  }
}
