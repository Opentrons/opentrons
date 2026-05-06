import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import { useAccessControlEnabledQuery } from '@opentrons/react-api-client'

import { getCurrentUsernameForLocalRobot } from '/app/redux/robot-auth'

import { useRequireDocumentation } from './useRequireDocumentation'
import { useRequireLogin } from './useRequireLogin'

import type { DocumentedActionKind } from '/app/resources/access-control'

/**
 * API for the access-control gate.
 *
 * Returns a function that, when invoked, runs the access-control gate:
 *   1. If access control is disabled on the robot, the gate is a no-op and
 *      resolves `true`.
 *   2. Otherwise, the login guard runs (opens the login modal if needed),
 *      then the documentation guard runs (opens the doc modal + audits).
 *
 * Resolves to `true` if the user passed the gate, `false` if they cancelled.
 *
 * @example
 *   const checkAccessControl = useGuardedAction({
 *     kind: 'PROTOCOL_PLAY'
 *   })
 *
 *   const onPlay = async (): Promise<void> => {
 *     if (!(await checkAccessControl())) return
 *     play()
 *   }
 */
export function useGuardedAction(
  action: DocumentedActionKind
): () => Promise<boolean> {
  const accessControlEnabledQuery = useAccessControlEnabledQuery()
  const currentUsername = useSelector(getCurrentUsernameForLocalRobot)
  const requireLogin = useRequireLogin(currentUsername)
  const requireDocumentation = useRequireDocumentation()
  const accessControlEnabled =
    accessControlEnabledQuery?.data?.data?.accessControlEnabled ?? false

  return useCallback(async () => {
    if (!accessControlEnabled) { return true }

    const loginResult = await requireLogin()
    if (loginResult == null) return false

    const docResult = await requireDocumentation(action, loginResult)
    if (docResult == null) return false

    return true
  }, [accessControlEnabled, action, requireLogin, requireDocumentation])
}
