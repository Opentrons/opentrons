import { showDocumentationRequiredModal } from './DocumentationRequiredModal'

import type {
  DocumentationReport,
  DocumentedAction,
} from '@opentrons/react-api-client'

/**
 * Callback that opens the DocumentationRequiredModal and returns the documentation report
 *
 */
export async function requireDocumentation(
  username: string,
  actionsToDocument: DocumentedAction[],
  minReportLength: number,
  onCancel?: () => void
): Promise<DocumentationReport> {
  const modalResult = await showDocumentationRequiredModal(
    username,
    actionsToDocument,
    minReportLength,
    onCancel
  )

  return modalResult
}
