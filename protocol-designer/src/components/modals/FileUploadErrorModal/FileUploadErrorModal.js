// @flow
import * as React from 'react'
import {AlertModal} from '@opentrons/components'
import modalStyles from '../modal.css'
import getModalContents from './modalContents'
import type {FileError} from '../../../load-file'

type Props = {
  error: ?FileError,
  onClose: (SyntheticEvent<*>) => mixed
}

export default function FileUploadErrorModal (props: Props) {
  const {error, onClose} = props

  if (!error) return null

  const {title, body} = getModalContents(error.errorType, error.message)
  return (
    <AlertModal
      heading={title}
      buttons={[{children: 'ok', onClick: onClose}]}
      className={modalStyles.modal}
      alertOverlay
    >
      {body}
    </AlertModal>
  )
}
