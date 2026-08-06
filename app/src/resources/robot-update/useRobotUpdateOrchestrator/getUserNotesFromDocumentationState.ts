import type { DocumentationState } from '@opentrons/react-api-client'

export function getUserNotesFromDocumentationState(
  documentationState: DocumentationState
): string {
  if (
    !documentationState.isLoading &&
    documentationState.accessControlEnabled &&
    documentationState.reasonForInteractionRequired
  ) {
    return documentationState.docreport ?? ''
  }
  return ''
}
