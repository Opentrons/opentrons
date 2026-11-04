import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { DocumentationRequired } from './DocumentationRequired'
import styles from './documentationrequired.module.css'

export interface DocumentationRequiredModalArgs {
  username: string
}

export interface DocumentationRequiredModalResult {
  note: string
  confirmedAt: string
}

const DocumentationRequiredModalImpl = NiceModal.create(
  ({ username }: { username: string }): JSX.Element => {
    const modal = useModal()

    const handleConfirm = (note: string): void => {
      const result: DocumentationRequiredModalResult = {
        note,
        confirmedAt: new Date().toISOString(),
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
): Promise<DocumentationRequiredModalResult | null> =>
  NiceModal.show(DocumentationRequiredModalImpl, { username })
