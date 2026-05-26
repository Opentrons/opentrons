import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { type DocumentationReport } from '/app/resources/access-control/types'

import { DocumentationRequired } from './DocumentationRequired'
import styles from './documentationrequired.module.css'

export interface DocumentationRequiredModalArgs {
  username: string
}

const DocumentationRequiredModalImpl = NiceModal.create(
  ({ username }: { username: string }): JSX.Element => {
    const modal = useModal()

    const handleConfirm = (note: string): void => {
      const result: DocumentationReport = {
        note,
        confirmedAt: new Date().toISOString(),
        documentedBy: username,
      }
      modal.resolve(result)
      modal.remove()
    }

    const handleBack = (): void => {
      modal.resolve(null)
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
): Promise<DocumentationReport | null> =>
  NiceModal.show(DocumentationRequiredModalImpl, { username })
