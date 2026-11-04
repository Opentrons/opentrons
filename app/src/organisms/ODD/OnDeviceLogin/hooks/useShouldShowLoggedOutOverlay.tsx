import { useSelector } from 'react-redux'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { getIsLoggedInToLocalRobot } from '/app/redux/robot-auth'

/** Returns whether the logged-out overlay should be shown. */
export function useShouldShowLoggedOutOverlay(
  isShowingLoginPage: boolean
): boolean {
  const accessControlEnabledQuery = useAccessControlEnabledQuery()
  const isLoggedIn = useSelector(getIsLoggedInToLocalRobot)
  const shouldShowLoggedOutOverlay =
    accessControlEnabledQuery.data != null &&
    accessControlEnabledQuery.data.data.accessControlEnabled &&
    !isLoggedIn &&
    !isShowingLoginPage
  return shouldShowLoggedOutOverlay
}
