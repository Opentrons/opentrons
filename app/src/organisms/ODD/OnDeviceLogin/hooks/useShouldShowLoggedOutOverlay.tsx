import { useSelector } from 'react-redux'

import {
  useAccessControlEnabledQuery,
  useSelfQuery,
} from '@opentrons/react-api-client'

import { getIsLoggedInToLocalRobot } from '/app/redux/robot-auth'

/** Returns whether the logged-out overlay should be shown. */
export function useShouldShowLoggedOutOverlay(
  isShowingLoginPage: boolean
): boolean {
  const accessControlEnabledQuery = useAccessControlEnabledQuery()
  const isLoggedIn = useSelector(getIsLoggedInToLocalRobot)
  const accessControlEnabled =
    accessControlEnabledQuery.data?.data?.accessControlEnabled ?? false
  const selfQuery = useSelfQuery({
    enabled: accessControlEnabled && isLoggedIn,
  })
  const resetPasswordRequired = selfQuery.data?.data.resetPassword ?? false
  const needsLogin = !isLoggedIn || resetPasswordRequired

  return (
    accessControlEnabledQuery.data != null &&
    accessControlEnabled &&
    needsLogin &&
    !isShowingLoginPage
  )
}
