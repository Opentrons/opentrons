import { useSelector } from 'react-redux'

import { useSelfQuery } from '@opentrons/react-api-client'

import { getIsLoggedInToLocalRobot } from '/app/redux/robot-auth'

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
export function useAccountIconInitial(): UseAccountIconInitialResult {
  const isLoggedIn = useSelector(getIsLoggedInToLocalRobot)
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
