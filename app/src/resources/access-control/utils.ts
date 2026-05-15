import { type DocumentationReport } from '/app/resources/access-control/types'

export function isDocumentationReportValid(
  docreport: DocumentationReport
): boolean {
  const { note, confirmedAt, documentedBy } = docreport
  const noteIsValid = note != null && note.length > 0
  const confirmedAtIsValid = confirmedAt != null && confirmedAt.length > 0
  const documentedByIsValid = documentedBy != null && documentedBy.length > 0
  return noteIsValid && confirmedAtIsValid && documentedByIsValid
}
