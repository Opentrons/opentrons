import { createContext } from 'react'

import type { DocumentationReport } from '/app/local-resources/access-control'

export interface DocumentationRequiredModalContextType {
  showDocumentationRequiredModal: (
    username: string
  ) => Promise<DocumentationReport>
}

/**
 * Context used to display the correct documentation modal on desktop or in the ODD
 */
export const DocumentationRequiredModalContext =
  createContext<DocumentationRequiredModalContextType>({
    showDocumentationRequiredModal: (username: string) => {
      return Promise.resolve('' as DocumentationReport)
    },
  })
