import { createContext, useState } from 'react'

import type { ReactNode } from 'react'
import type {
  DocumentationReport,
  DocumentedAction,
} from '@opentrons/react-api-client'

export interface DocumentationRequiredModalContextType {
  showDocumentationRequiredModal: (
    username: string,
    actionsToDocument: DocumentedAction[]
  ) => Promise<DocumentationReport>
  setIsLoading: (isLoading: boolean) => void
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
    setIsLoading: () => {},
  })

// TODO(jj): Right now, the ODD and desktop use <InProgressModal> for the loading screen.
// this should be replaced with a designed loading modal.
export const DocumentationRequiredContextProvider = ({
  children,
  showDocumentationRequiredModal,
  loadingModal,
}: {
  children: ReactNode
  showDocumentationRequiredModal: (
    username: string,
    actionsToDocument: DocumentedAction[]
  ) => Promise<DocumentationReport>
  loadingModal: ReactNode
}): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <DocumentationRequiredModalContext.Provider
      value={{ showDocumentationRequiredModal, setIsLoading }}
    >
      {isLoading && loadingModal}
      {children}
    </DocumentationRequiredModalContext.Provider>
  )
}
