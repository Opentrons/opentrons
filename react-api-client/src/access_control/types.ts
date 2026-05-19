export interface DocumentationReport {
  note: string
  confirmedAt: string
  documentedBy: string
}

/**
 * Documentation state to be passed to the useDocumentedMutation hook.
 *
 * @param accessControlEnabled - whether access control is enabled
 * @param docreport - the documentation report
 * @param askForDocumentation - a function that opens the documentation modal and returns the documentation report
 */
export type DocumentationState =
  | { accessControlEnabled: false }
  | { accessControlEnabled: true; docreport: DocumentationReport }
  | {
      accessControlEnabled: true
      docreport: null
      askForDocumentation: () => Promise<DocumentationReport>
    }
