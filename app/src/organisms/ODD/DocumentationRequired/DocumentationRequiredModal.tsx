import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { type DocumentationReport } from '/app/local-resources/access-control/types'

import { DocumentationRequired } from './DocumentationRequired'
import styles from './documentationrequired.module.css'

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
