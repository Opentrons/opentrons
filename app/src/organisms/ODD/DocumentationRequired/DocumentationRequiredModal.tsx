import NiceModal, { useModal } from '@ebay/nice-modal-react'

import { DocumentationRequired } from './DocumentationRequired'
import styles from './documentationrequired.module.css'

export interface DocumentationRequiredModalArgs {
  userName: string
}

export interface DocumentationRequiredModalResult {
  note: string
  confirmedAt: string
}

const DocumentationRequiredModalImpl = NiceModal.create(
  ({ userName }: DocumentationRequiredModalArgs): JSX.Element => {
    const modal = useModal()
    return (
      <div className={styles.overlay}>
        <DocumentationRequired
          userName={userName}
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

/**
 * Open the documentation-required overlay and await the result.
 */
export const showDocumentationRequiredModal = (
  args: DocumentationRequiredModalArgs
): Promise<DocumentationRequiredModalResult | null> =>
  NiceModal.show(
    DocumentationRequiredModalImpl,
    args
  ) as Promise<DocumentationRequiredModalResult | null>
