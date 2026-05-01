import { useCallback } from 'react'

import { showDocumentationRequiredModal } from '/app/organisms/ODD/DocumentationRequired'
import { usePostDocumentationMutation } from '/app/resources/access-control'

import type {
  DocumentedAction,
  DocumentationResult,
} from '/app/resources/access-control'
import type { RequireLoginResult } from './useRequireLogin'

export type RequireDocumentationGuard = (
  action: DocumentedAction,
  loginResult: RequireLoginResult
) => Promise<DocumentationResult | null>

/**
 * Guard hook that captures a documentation note for an action and posts it
 * to the audit log.
 *
 * Trusts the upstream login guard for the access-control state: if
 * `loginResult.username` is null, access control is disabled.
 *
 * Returns `null` if the user backs out of the documentation modal.
 */
export function useRequireDocumentation(): RequireDocumentationGuard {
  const postDocumentation = usePostDocumentationMutation()

  return useCallback(
    async (action, loginResult) => {
      if (loginResult.username == null) {
        return {
          note: '',
          confirmedAt: new Date().toISOString(),
          documentedBy: '',
        }
      }

      const modalResult = await showDocumentationRequiredModal({
        userName: loginResult.username,
      })
      if (modalResult == null) return null

      await postDocumentation.mutateAsync({
        action,
        note: modalResult.note,
        username: loginResult.username,
        confirmedAt: modalResult.confirmedAt,
      })

      return {
        note: modalResult.note,
        confirmedAt: modalResult.confirmedAt,
        documentedBy: loginResult.username,
      }
    },
    [postDocumentation]
  )
}
