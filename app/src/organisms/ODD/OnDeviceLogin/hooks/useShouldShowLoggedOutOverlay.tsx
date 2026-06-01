import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { useLocalRobotAuthSelf } from '/app/resources/auth'

/** Returns whether the logged-out overlay should be shown. */
export function useShouldShowLoggedOutOverlay(
  isShowingLoginPage: boolean
): boolean {
  const accessControlEnabledQuery = useAccessControlEnabledQuery()
  const { isLoggedIn, resetPasswordRequired } = useLocalRobotAuthSelf()
  const accessControlEnabled =
    accessControlEnabledQuery.data?.data?.accessControlEnabled ?? false
  const needsLogin = !isLoggedIn || resetPasswordRequired

  return (
    accessControlEnabledQuery.data != null &&
    accessControlEnabled &&
    needsLogin &&
    !isShowingLoginPage
  )
}
