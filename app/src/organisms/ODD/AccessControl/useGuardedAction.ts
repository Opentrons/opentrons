import { useCallback } from 'react'

import { useRequireDocumentation } from './useRequireDocumentation'
import { useRequireLogin } from './useRequireLogin'

import type { DocumentedAction } from '/app/resources/access-control'

/**
 * API for the access-control gate.
 *
 * Returns a function that, when invoked, runs two ordered guards:
 *   1. `useRequireLogin`         — opens the login modal if needed.
 *   2. `useRequireDocumentation` — opens the documentation modal + audits.
 *
 * Both guards no-op when access control is disabled on the robot
 * and resolves to `true` if the user passed both guards, `false` if they
 * cancelled at any step.
 */
export function useGuardedAction(
  action: DocumentedAction
): () => Promise<boolean> {
  const requireLogin = useRequireLogin()
  const requireDocumentation = useRequireDocumentation()

  return useCallback(async () => {
    const loginResult = await requireLogin()
    if (loginResult == null) return false

    const docResult = await requireDocumentation(action, loginResult)
    if (docResult == null) return false

    return true
  }, [action, requireLogin, requireDocumentation])
}
