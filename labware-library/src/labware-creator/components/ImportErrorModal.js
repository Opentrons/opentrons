// @flow
import * as React from 'react'
import { AlertModal } from '@opentrons/components'
import styles from '../styles.css'
import type { ImportError, ImportErrorKey } from '../fields'

const ERROR_MAP: { [ImportErrorKey]: React.Node } = {
  NOT_JSON: 'This is not a .json file',
  INVALID_JSON_FILE: 'This is not valid JSON file',
  INVALID_LABWARE_DEF: 'This is not a valid labware definition',
  UNSUPPORTED_LABWARE_PROPERTIES: (
    <>
      <p>
        This labware definition appears valid, but is not yet supported in
        Labware Creator.
      </p>
      <p>
        Labware Creator currently only supports labware with a single regular
        grid. Also, it does not support tipracks or trash boxes.
      </p>
    </>
  ),
}

const ImportErrorModal = (props: {|
  onClose: () => mixed,
  importError: ImportError,
|}) => {
  const { importError, onClose } = props
  return (
    <AlertModal
      className={styles.error_modal}
      heading="Cannot import file"
      onCloseClick={onClose}
      buttons={[{ onClick: onClose, children: 'close' }]}
    >
      {ERROR_MAP[importError.key]}
      {props.importError.message != null && (
        <div className={styles.error_message}>{importError.message}</div>
      )}
    </AlertModal>
  )
}

export default ImportErrorModal
