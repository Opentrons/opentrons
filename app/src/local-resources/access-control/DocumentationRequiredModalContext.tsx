import { createContext } from 'react'

import type {
  DocumentationReport,
  DocumentationState,
  DocumentedAction,
} from '@opentrons/react-api-client'

export interface DocumentationRequiredModalContextType {
  showDocumentationRequiredModal: (
    username: string,
    actionsToDocument: DocumentedAction[],
    minReportLength: number,
    onCancel?: () => void,
    initialDocreport?: DocumentationReport
  ) => Promise<DocumentationReport>
  showLoginModal: ({
    robotName,
    key,
  }: {
    robotName: string
    key?: string
  }) => Promise<{ username: string } | null>
  showSignRunModal: (documentationState: DocumentationState) => Promise<boolean>
  showDownloadLogsModal: (logPeriodId: string) => Promise<boolean>
}

/**
 * Context used to display the correct documentation modal on desktop or in the ODD
 */
export const DocumentationRequiredModalContext =
  createContext<DocumentationRequiredModalContextType>({
    showDocumentationRequiredModal: (
      username: string,
      actionsToDocument: DocumentedAction[],
      minReportLength: number,
      onCancel?: () => void,
      initialDocreport?: DocumentationReport
    ) => {
      return Promise.resolve('' as DocumentationReport)
    },
    showLoginModal: () => Promise.resolve(null),
    showSignRunModal: () => Promise.resolve(false),
    showDownloadLogsModal: () => Promise.resolve(false),
  })
