import { createContext } from 'react'

import type {
  DocumentationReport,
  DocumentedAction,
} from '@opentrons/react-api-client'

export interface DocumentationRequiredModalContextType {
  showDocumentationRequiredModal: (
    username: string,
    actionsToDocument: DocumentedAction[],
    onCancel?: () => void,
    initialDocreport?: DocumentationReport
  ) => Promise<DocumentationReport>
  showLoginModal: ({
    robotName,
  }: {
    robotName: string
  }) => Promise<{ username: string } | null>
}

/**
 * Context used to display the correct documentation modal on desktop or in the ODD
 */
export const DocumentationRequiredModalContext =
  createContext<DocumentationRequiredModalContextType>({
    showDocumentationRequiredModal: (
      username: string,
      actionsToDocument: DocumentedAction[],
      onCancel?: () => void,
      initialDocreport?: DocumentationReport
    ) => {
      return Promise.resolve('' as DocumentationReport)
    },
    showLoginModal: () => Promise.resolve(null),
  })
