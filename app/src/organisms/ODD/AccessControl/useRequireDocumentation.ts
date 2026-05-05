import { useCallback } from 'react'

import { showDocumentationRequiredModal } from '/app/organisms/ODD/DocumentationRequired'
import { postDocumentation } from '/app/resources/access-control'

import type {
  DocumentationResult,
  DocumentedAction,
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
 * Assumes access control is enabled and the user is authenticated.
 */
export function useRequireDocumentation(): RequireDocumentationGuard {
  return useCallback(async (action, loginResult) => {
    const modalResult = await showDocumentationRequiredModal({
      userName: loginResult.username,
    })
    if (modalResult == null) return null

    await postDocumentation({
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
  }, [])
}
