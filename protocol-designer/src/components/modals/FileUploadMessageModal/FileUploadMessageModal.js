// @flow
import * as React from 'react'
import {AlertModal} from '@opentrons/components'
import modalStyles from '../modal.css'
import getModalContents from './modalContents'
import type {FileUploadMessage} from '../../../load-file'

type Props = {
  message: ?FileUploadMessage,
  dismissModal: (SyntheticEvent<*>) => mixed,
}

export default function FileUploadMessageModal (props: Props) {
  const {message, dismissModal} = props

  if (!message) return null

  const {title, body} = getModalContents(message)
  return (
    <AlertModal
      heading={title}
      buttons={[{children: 'ok', onClick: dismissModal}]}
      className={modalStyles.modal}
      alertOverlay
    >
      {body}
    </AlertModal>
  )
}
