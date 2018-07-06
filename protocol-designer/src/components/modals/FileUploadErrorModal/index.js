// @flow
import * as React from 'react'
import {AlertModal} from '@opentrons/components'
import {Portal} from '../../portals/MainPageModalPortal'
import modalStyles from '../modal.css'
import getModalContents from './modalContents'
import type {FileUploadErrorType} from './types'

type Props = {
  errorType: FileUploadErrorType,
  errorMessage: ?string,
  onClose: (SyntheticEvent<*>) => mixed
}

export type {FileUploadErrorType}

export default function FileUploadErrorModal (props: Props) {
  const {title, body} = getModalContents(props.errorType, props.errorMessage)
  return (
    <Portal>
      <AlertModal
        heading={title}
        buttons={[{children: 'ok', onClick: props.onClose}]}
        className={modalStyles.modal}
        alertOverlay
      >
        {body}
      </AlertModal>
    </Portal>
  )
}
