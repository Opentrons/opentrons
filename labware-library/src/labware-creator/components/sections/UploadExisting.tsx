import * as React from 'react'
import { DeprecatedPrimaryButton } from '@opentrons/components'
import { ImportLabware } from '../ImportLabware'
import styles from '../../styles.module.css'

interface Props {
  disabled: boolean
  labwareTypeChildFields: any
  lastUploaded: any
  onClick: () => void
  onUpload: (
    event:
      | React.DragEvent<HTMLLabelElement>
      | React.ChangeEvent<HTMLInputElement>
  ) => void
}

export const UploadExisting = (props: Props): JSX.Element => {
  const {
    disabled,
    labwareTypeChildFields,
    lastUploaded,
    onClick,
    onUpload,
  } = props
  return (
    <div className={styles.upload_existing_section}>
      <h2 className={styles.setup_heading}>
        Edit a file you’ve built with our labware creator
      </h2>
      {lastUploaded === null ? (
        <ImportLabware onUpload={onUpload} />
      ) : (
        <div className={styles.labware_type_fields}>
          {labwareTypeChildFields}
          <DeprecatedPrimaryButton
            className={styles.start_creating_btn}
            onClick={onClick}
            disabled={disabled}
          >
            start editing labware
          </DeprecatedPrimaryButton>
        </div>
      )}
    </div>
  )
}
