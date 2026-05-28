import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { DocumentationRequired } from './DocumentationRequired'
import styles from './documentationrequired.module.css'

import type { DocumentationReport } from '@opentrons/react-api-client'

export interface DocumentationRequiredModalArgs {
  username: string
}

const DocumentationRequiredModalImpl = NiceModal.create(
  ({ username }: { username: string }): JSX.Element => {
    const modal = useModal()

    const handleConfirm = (note: string): void => {
      const result: DocumentationReport = note as DocumentationReport
      modal.resolve(result)
      modal.remove()
    }

    const handleBack = (): void => {
      modal.resolve('' as DocumentationReport)
      modal.remove()
    }

    return (
      <div className={styles.overlay}>
        <DocumentationRequired
          username={username}
          onConfirm={handleConfirm}
          onBack={handleBack}
        />
      </div>
    )
  }
)

export const showDocumentationRequiredModal = (
  username: string
): Promise<DocumentationReport> =>
  NiceModal.show(DocumentationRequiredModalImpl, { username })
