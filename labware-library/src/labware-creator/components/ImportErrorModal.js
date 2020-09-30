// @flow
import * as React from 'react'
import { AlertModal } from '@opentrons/components'
import styles from '../styles.css'
import type { ImportError, ImportErrorKey } from '../fields'

const ERROR_MAP: { [ImportErrorKey]: React.Node } = {
  INVALID_FILE_TYPE: 'This is not a .json file',
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

export const ImportErrorModal = (props: {|
  onClose: () => mixed,
  importError: ImportError,
|}): React.Node => {
  const { importError, onClose } = props
  return (
    <AlertModal
      className={styles.error_modal}
      heading="Cannot import file"
      onCloseClick={onClose}
      buttons={[{ onClick: onClose, children: 'close' }]}
    >
      {ERROR_MAP[importError.key]}
      {importError.messages != null && importError.messages.length > 0 && (
        <div>
          {importError.messages.map((message, i) => (
            <p key={i} className={styles.error_message}>
              {message}
            </p>
          ))}
        </div>
      )}
    </AlertModal>
  )
}
