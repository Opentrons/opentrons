// @flow
import assert from 'assert'
import * as React from 'react'
import styles from './modalContents.css'
import type { ModalContents } from './types'
import type { FileUploadMessage } from '../../../load-file'

const INVALID_FILE_TYPE: ModalContents = {
  title: 'Incorrect file type',
  body: (
    <React.Fragment>
      <p>Only JSON files created in the Protocol Designer can be imported.</p>
      <p>At this time Python protocol files are not supported.</p>
    </React.Fragment>
  ),
}

const invalidJsonModal = (errorMessage: ?string): ModalContents => ({
  title: 'Invalid JSON file',
  body: (
    <React.Fragment>
      <p>
        This file is either missing information it needs to import properly or
        contains sections that the Protocol Designer cannot read.
      </p>
      <p>
        At this time we do not support JSON files created outside of the
        Protocol Designer.
      </p>
      <p>
        If this is a Protocol Designer file that you have edited outside of this
        tool you may have introduced errors.
      </p>

      <div className={styles.error_wrapper}>
        <p>Error message:</p>
        <p className={styles.error_text}>{errorMessage}</p>
      </div>
    </React.Fragment>
  ),
})

const didMigrateModal: ModalContents = {
  title: 'Your protocol was made in an older version of Protocol Designer',
  body: (
    <React.Fragment>
      <p>
        Your protocol will be automatically updated to the latest version.
        Please note that the updated file will be incompatible with older
        versions of the Protocol Designer. We recommend making a separate copy
        of the file that you just imported before continuing.
      </p>
      <p>
        Updating the file may make changes to liquid handling actions. Please
        review your file in the Protocol Designer as well as with a water run on
        the robot.
      </p>
      <p>As always, please contact us with any questions or feedback.</p>
    </React.Fragment>
  ),
}

export default function getModalContents(
  uploadResponse: FileUploadMessage
): ModalContents {
  if (uploadResponse.isError) {
    switch (uploadResponse.errorType) {
      case 'INVALID_FILE_TYPE':
        return INVALID_FILE_TYPE
      case 'INVALID_JSON_FILE':
        return invalidJsonModal(uploadResponse.errorMessage)
      default: {
        console.warn('Invalid error type specified for modal')
        return { title: 'Error', body: 'Error' }
      }
    }
  }
  switch (uploadResponse.messageKey) {
    case 'didMigrate':
      return didMigrateModal
    default: {
      assert(
        false,
        `invalid messageKey ${uploadResponse.messageKey} specified for modal`
      )
      return { title: '', body: uploadResponse.messageKey }
    }
  }
}
