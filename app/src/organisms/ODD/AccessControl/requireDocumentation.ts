import { showDocumentationRequiredModal } from '/app/organisms/ODD/DocumentationRequired/DocumentationRequiredModal'
import { isDocumentationReportValid } from '/app/resources/access-control/utils'

import type {
  DocumentationReport,
  DocumentedActionKind,
} from '../../../resources/access-control/types'

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
  actionsToDocument: DocumentedActionKind[],
  username: string
): Promise<DocumentationReport> {
  const modalResult = await showDocumentationRequiredModal(username)
  if (modalResult == null || !isDocumentationReportValid(modalResult)) {
    // TODO(jj): eventually, this will be handled on the backend and become unnecessary.
    throw new Error(
      `No documentation provided for action: ${modalResult?.note}`
    )
  }

  const { note, confirmedAt } = modalResult

  return {
    note,
    confirmedAt,
    documentedBy: username,
  }
}
