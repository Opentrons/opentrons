// @flow
import * as React from 'react'
import {AlertModal} from '@opentrons/components'
import modalStyles from '../modal.css'
import getModalContents from './modalContents'
import type {FileError} from '../../../load-file'

type Props = {
  error: ?FileError,
  dismissModal: (SyntheticEvent<*>) => mixed,
}

export default function FileUploadErrorModal (props: Props) {
  const {error, dismissModal} = props

  if (!error) return null

  const {title, body} = getModalContents(error.errorType, error.message)
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
