import { createPortal } from 'react-dom'
import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { getTopPortalEl } from '/app/App/portal'

import { DocumentationRequired } from './DocumentationRequired'

import type {
  DocumentationReport,
  DocumentedAction,
} from '@opentrons/react-api-client'

const DocumentationRequiredModalImpl = NiceModal.create(
  ({
    username,
    actionsToDocument,
    onCancel,
    initialDocreport,
  }: {
    username: string
    actionsToDocument: DocumentedAction[]
    onCancel?: () => void
    initialDocreport?: DocumentationReport
  }): JSX.Element => {
    const modal = useModal()

    const handleConfirm = (note: string): void => {
      const result: DocumentationReport = note as DocumentationReport
      modal.resolve(result)
      modal.remove()
    }

    const handleBack = (): void => {
      onCancel?.()
      modal.resolve('' as DocumentationReport)
      modal.remove()
    }

    return createPortal(
      <DocumentationRequired
        username={username}
        actionsToDocument={actionsToDocument}
        onConfirm={handleConfirm}
        onClose={handleBack}
        initialDocreport={initialDocreport}
      />,
      getTopPortalEl()
    )
  }
)

export const showDocumentationRequiredModal = (
  username: string,
  actionsToDocument: DocumentedAction[],
  onCancel?: () => void,
  initialDocreport?: DocumentationReport
): Promise<DocumentationReport> =>
  NiceModal.show(DocumentationRequiredModalImpl, {
    username,
    actionsToDocument,
    onCancel,
    initialDocreport,
  })
