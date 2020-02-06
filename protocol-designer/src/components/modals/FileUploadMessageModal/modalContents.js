// @flow
import assert from 'assert'
import * as React from 'react'
import styles from './modalContents.css'
import type { ModalContents } from './types'
import type { FileUploadMessage } from '../../../load-file'

const INVALID_FILE_TYPE: ModalContents = {
  title: 'Incorrect file type',
  body: (
    <>
      <p>Only JSON files created in the Protocol Designer can be imported.</p>
      <p>At this time Python protocol files are not supported.</p>
    </>
  ),
}

const invalidJsonModal = (errorMessage: ?string): ModalContents => ({
  title: 'Invalid JSON file',
  body: (
    <>
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
    </>
  ),
})

const genericDidMigrateMessage: ModalContents = {
  title: 'Your protocol was made in an older version of Protocol Designer',
  body: (
    <>
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
    </>
  ),
}

const toV3MigrationMessage: ModalContents = {
  title: 'Update protocol to use new labware definitions',
  okButtonText: 'update protocol',
  body: (
    <div className={styles.migration_message}>
      <p>
        <strong>
          To import your file successfully, you must update your protocol to use
          the new labware definitions.
        </strong>{' '}
        Your protocol was made using an older version of Protocol Designer.
        Since then, Protocol Designer has been improved to include new labware
        definitions which are more accurate and reliable.
      </p>

      <div className={styles.section_header}>
        What this means for your protocol
      </div>
      <p>
        Updating your protocol to use the new labware definitions will
        consequently require you to re-calibrate all labware in your protocol
        prior to running it on your robot. We recommend you try a dry run or one
        with water to ensure everything is working as expected.
      </p>

      <div className={styles.section_header}>
        {"What happens if you don't update"}
      </div>
      <div>
        <p>
          If you choose not to update, you will still be able to run your
          protocol as usual with older labware, however you will not be able to
          make further updates to this protocol using the Protocol Designer.
        </p>
      </div>

      <div className={styles.note}>
        Please note that in order to run the updated protocol on your robot
        successfully, the OT-2 App and robot are required to be updated to
        version 3.10.0 or higher.
      </div>
    </div>
  ),
}

function getMigrationMessage(migrationsRan: Array<string>): ModalContents {
  if (migrationsRan.includes('3.0.0')) {
    return toV3MigrationMessage
  }
  return genericDidMigrateMessage
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
    case 'DID_MIGRATE':
      return getMigrationMessage(uploadResponse.migrationsRan)
    default: {
      assert(
        false,
        `invalid messageKey ${uploadResponse.messageKey} specified for modal`
      )
      return { title: '', body: uploadResponse.messageKey }
    }
  }
}
