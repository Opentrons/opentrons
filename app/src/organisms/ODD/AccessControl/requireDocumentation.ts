import { showDocumentationRequiredModal } from '/app/organisms/ODD/DocumentationRequired/DocumentationRequiredModal'
import { postDocumentation } from '/app/resources/access-control/postDocumentation'

import type {
  DocumentationResult,
  DocumentedActionKind,
} from '../../../resources/access-control/types'
import type { RequireLoginResult } from './requireLogin'

/**
 * Guard that captures a documentation note for an action and posts it
 * to the audit log.
 *
 * Assumes access control is enabled and the user is authenticated.
 */
export async function requireDocumentation(
  actionsToDocument: DocumentedActionKind[],
  username: string
): Promise<DocumentationResult | null> {
  const modalResult = await showDocumentationRequiredModal({
    username,
  })
  if (modalResult == null) {
    return null
  }

  const { note, confirmedAt } = modalResult

  await postDocumentation({
    actionsToDocument,
    note,
    username,
    confirmedAt,
  })

  return {
    note,
    confirmedAt,
    documentedBy: username,
  }
}
