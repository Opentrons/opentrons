import { createContext } from 'react'

import type {
  DocumentationReport,
  DocumentedAction,
} from '@opentrons/react-api-client'

export interface DocumentationRequiredModalContextType {
  showDocumentationRequiredModal: (
    username: string,
    actionsToDocument: DocumentedAction[]
  ) => Promise<DocumentationReport>
}

/**
 * Context used to display the correct documentation modal on desktop or in the ODD
 */
export const DocumentationRequiredModalContext =
  createContext<DocumentationRequiredModalContextType>({
    showDocumentationRequiredModal: (
      username: string,
      actionsToDocument: DocumentedAction[]
    ) => {
      return Promise.resolve('' as DocumentationReport)
    },
  })
