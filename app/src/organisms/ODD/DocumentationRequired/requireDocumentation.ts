import { showDocumentationRequiredModal } from './DocumentationRequiredModal'

import type {
  DocumentationReport,
  DocumentedAction,
} from '@opentrons/react-api-client'

/**
 * Guard that captures a pops DocumentationRequiredModal and returns the documentation report
 *
 * Assumes access control is enabled and the user is authenticated.
 *
 * TODO(jj): do something with the actionsToDocument
 *
 * @throws {Error} if the documentation report is invalid
 */
export async function requireDocumentation(
  username: string,
  actionsToDocument: DocumentedAction[],
  onCancel?: () => void
): Promise<DocumentationReport> {
  const modalResult = await showDocumentationRequiredModal(
    username,
    actionsToDocument,
    onCancel
  )

  return modalResult
}
