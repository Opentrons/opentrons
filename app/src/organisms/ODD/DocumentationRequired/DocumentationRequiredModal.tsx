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
  ({ username }: DocumentationRequiredModalArgs): JSX.Element => {
    const modal = useModal()
    return (
      <div className={styles.overlay}>
        <DocumentationRequired
          username={username}
          onConfirm={note => {
            const result: DocumentationRequiredModalResult = {
              note,
              confirmedAt: new Date().toISOString(),
            }
            modal.resolve(result)
            modal.remove()
          }}
          onBack={() => {
            modal.resolve(null)
            modal.remove()
          }}
        />
      </div>
    )
  }
)

export const showDocumentationRequiredModal = (
  args: DocumentationRequiredModalArgs
): Promise<DocumentationRequiredModalResult | null> =>
  NiceModal.show(
    DocumentationRequiredModalImpl,
    args
  ) as Promise<DocumentationRequiredModalResult | null>
