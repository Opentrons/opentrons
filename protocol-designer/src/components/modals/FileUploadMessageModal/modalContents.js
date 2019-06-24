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
  title:
    'Your protocol must be updated to work with the updated Protocol Designer',
  okButtonText: "yes, update my protocol's labware",
  body: (
    <div className={styles.migration_message}>
      <div className={styles.section_header}>What is changing</div>
      <p>
        All labware definitions (the information that tells your robot about the
        geometry of labware) are being updated to a newer version
      </p>

      <div className={styles.section_header}>Why we made this update</div>
      <p>
        {
          "These definitions should be more accurate and thus more reliable across our users' robots."
        }
      </p>

      <div className={styles.section_header}>
        What this means for your protocol
      </div>
      <div>
        <p>
          If you update your protocol then all labware in it will be switched to
          the new definition version. This means that:
        </p>
        <ol>
          <li>You will need to re-calibrate all labware in the protocol.</li>
          <li>
            We recommend you do a dry run or one with water just to make sure
            everything is still working fine.
          </li>
        </ol>
      </div>

      <div className={styles.section_header}>
        {"What happens if you don't update"}
      </div>
      <p>
        You will still be able to run your protocol as usual with the older
        labware definitions. However in order to make further updates with the
        Protocol Designer you will need to update your protocol.
      </p>
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
