import { useCallback } from 'react'

import { showDocumentationRequiredModal } from '/app/organisms/ODD/DocumentationRequired/DocumentationRequiredModal'
import { postDocumentation } from '/app/resources/access-control/postDocumentation'

import type {
  DocumentationResult,
  DocumentedActionKind,
} from '../../../resources/access-control/types'
import type { RequireLoginResult } from './useRequireLogin'

export type RequireDocumentationGuard = (
  actionsToDocument: DocumentedActionKind[],
  loginResult: RequireLoginResult
) => Promise<DocumentationResult | null>

/**
 * Guard hook that captures a documentation note for an action and posts it
 * to the audit log.
 *
 * Assumes access control is enabled and the user is authenticated.
 */
export function useRequireDocumentation(): RequireDocumentationGuard {
  return useCallback(async (actionsToDocument, loginResult) => {
    const modalResult = await showDocumentationRequiredModal({
      username: loginResult.username,
    })
    if (modalResult == null) {
      return null
    }

    const { note, confirmedAt } = modalResult

    await postDocumentation({
      actionsToDocument,
      note: note,
      username: loginResult.username,
      confirmedAt,
    })

    return {
      note: note,
      confirmedAt: confirmedAt,
      documentedBy: loginResult.username,
    }
  }, [])
}
