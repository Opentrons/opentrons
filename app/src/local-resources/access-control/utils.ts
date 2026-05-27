import type {
  DocumentationReport,
  DocumentationState,
} from '@opentrons/react-api-client'

export function isDocumentationReportValid(
  docreport: DocumentationReport
): boolean {
  return docreport != null && docreport.length > 0
}

export function isDocumentationProvided(state: DocumentationState): boolean {
  if (!state.accessControlEnabled) {
    return true
  }
  return state.docreport != null && state.docreport.length > 0
}
