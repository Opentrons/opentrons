import { useSelector } from 'react-redux'

import { useSelfQuery } from '@opentrons/react-api-client'

import { getAuthStateForRobot } from '/app/redux/robot-auth'

import type { State } from '/app/redux/types'

export type UseAccountIconInitialResult =
  | {
      showIcon: true
      iconContents: string
    }
  | {
      showIcon: false
    }

/**
 * Returns what to show in the account icon, if anything.
 * (The first initial of the user's name.)
 */
export function useAccountIconInitial(
  robotName: string | null
): UseAccountIconInitialResult {
  const isLoggedIn = useSelector(
    (state: State) =>
      robotName != null && getAuthStateForRobot(state, robotName) != null
  )
  const query = useSelfQuery({
    enabled: isLoggedIn,
  })

  if (!isLoggedIn) {
    return {
      showIcon: false,
    }
  } else if (query.isLoading || query.isError || query.isIdle) {
    return {
      showIcon: true,
      iconContents: '',
    }
  } else {
    const response = query.data
    const fullName = response.data.fullName
    const maybeFirstChar = fullName.at(0) ?? ''
    return {
      showIcon: true,
      iconContents: maybeFirstChar.toLocaleUpperCase(),
    }
  }
}
