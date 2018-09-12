// @flow
import * as React from 'react'
import styles from './modalContents.css'
import type {ModalContents} from './types'
import type {FileUploadErrorType} from '../../../load-file'

const INVALID_FILE_TYPE: ModalContents = {
  title: 'Incorrect file type',
  body: <React.Fragment>
    <p>Only JSON files created in the Protocol Designer can be imported.</p>
    <p>At this time Python protocol files are not supported.</p>
  </React.Fragment>,
}

const invalidJsonModal = (errorMessage: ?string): ModalContents => ({
  title: 'Invalid JSON file',
  body: <React.Fragment>
    <p>This file is either missing information it needs to import properly or contains sections that the Protocol Designer cannot read.</p>
    <p>At this time we do not support JSON files created outside of the Protocol Designer.</p>
    <p>If this is a Protocol Designer file that you have edited outside of this tool you may have introduced errors.</p>

    <div className={styles.error_wrapper}>
      <p>Error message:</p>
      <p className={styles.error_text}>{errorMessage}</p>
    </div>
  </React.Fragment>,
})

export default function getModalContents (
  errorType: FileUploadErrorType,
  message: ?string
): ModalContents {
  switch (errorType) {
    case 'INVALID_FILE_TYPE': return INVALID_FILE_TYPE
    case 'INVALID_JSON_FILE': return invalidJsonModal(message)
  }
  console.warn('Invalid error type specified for modal')
  return {title: 'Error', body: 'Error'}
}
