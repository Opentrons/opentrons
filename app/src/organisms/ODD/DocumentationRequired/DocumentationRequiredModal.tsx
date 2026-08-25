import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { DocumentationRequired } from './DocumentationRequired'
import styles from './documentationrequired.module.css'

import type { ReactNode } from 'react'
import type {
  DocumentationReport,
  DocumentedAction,
} from '@opentrons/react-api-client'

const DocumentationRequiredModalImpl = NiceModal.create(
  ({
    username,
    actionsToDocument,
    minReportLength,
    onCancel,
    initialDocreport,
  }: {
    username: string
    actionsToDocument: DocumentedAction[]
    minReportLength: number
    onCancel?: () => void
    initialDocreport?: DocumentationReport
  }): ReactNode => {
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

    return (
      <div className={styles.overlay}>
        <DocumentationRequired
          username={username}
          actionsToDocument={actionsToDocument}
          onConfirm={handleConfirm}
          onBack={handleBack}
          initialDocreport={initialDocreport}
          minReportLength={minReportLength}
        />
      </div>
    )
  }
)

export const showDocumentationRequiredModal = (
  username: string,
  actionsToDocument: DocumentedAction[],
  minReportLength: number,
  onCancel?: () => void,
  initialDocreport?: DocumentationReport
): Promise<DocumentationReport> =>
  NiceModal.show(DocumentationRequiredModalImpl, {
    username,
    actionsToDocument,
    minReportLength,
    onCancel,
    initialDocreport,
  })
