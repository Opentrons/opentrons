// @flow
import * as React from 'react'
import { AlertModal } from '@opentrons/components'
import modalStyles from '../modal.css'
import getModalContents from './modalContents'
import type { FileUploadMessage } from '../../../load-file'

type Props = {
  message: ?FileUploadMessage,
  cancelProtocolMigration: (SyntheticEvent<*>) => mixed,
  dismissModal: (SyntheticEvent<*>) => mixed,
}

export default function FileUploadMessageModal(props: Props) {
  const { message, cancelProtocolMigration, dismissModal } = props

  if (!message) return null

  const { title, body, okButtonText } = getModalContents(message)
  return (
    <AlertModal
      heading={title}
      buttons={[
        { children: 'cancel', onClick: cancelProtocolMigration },
        { children: okButtonText || 'ok', onClick: dismissModal },
      ]}
      className={modalStyles.modal}
      alertOverlay
    >
      {body}
    </AlertModal>
  )
}
