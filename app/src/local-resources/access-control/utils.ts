import { type DocumentationState } from '@opentrons/react-api-client/src/access_control/types'

import { type DocumentationReport } from './types'

export function isDocumentationReportValid(
  docreport: DocumentationReport
): boolean {
  const { note, confirmedAt, documentedBy } = docreport
  const noteIsValid = note != null && note.length > 0
  const confirmedAtIsValid = confirmedAt != null && confirmedAt.length > 0
  const documentedByIsValid = documentedBy != null && documentedBy.length > 0
  return noteIsValid && confirmedAtIsValid && documentedByIsValid
}

export function isDocumentationProvided(state: DocumentationState): boolean {
  if (!state.accessControlEnabled) {
    return true
  }
  return state.docreport != null
}
