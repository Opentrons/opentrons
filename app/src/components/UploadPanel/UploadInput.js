// @flow
import { Icon, PrimaryButton } from '@opentrons/components'
import * as React from 'react'

import styles from './upload-panel.css'

export type UploadInputProps = {|
  onUpload: (
    SyntheticInputEvent<HTMLInputElement> | SyntheticDragEvent<>
  ) => void,
  isButton?: boolean,
|}

export function UploadInput(props: UploadInputProps): React.Node {
  const { isButton, onUpload } = props

  const Label = isButton ? PrimaryButton : 'label'

  const labelText = isButton ? 'Open' : 'Drag and drop protocol file here'

  const labelProps = isButton
    ? {
        Component: 'label',
        iconName: 'ot-file',
        className: styles.upload_button,
      }
    : { onDrop: onUpload, className: styles.file_drop }

  return (
    <div className={styles.upload}>
      <Label {...labelProps}>
        {!isButton && <Icon name="upload" className={styles.file_drop_icon} />}
        {labelText}
        <input className={styles.file_input} type="file" onChange={onUpload} />
      </Label>
    </div>
  )
}
