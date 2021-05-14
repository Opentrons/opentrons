import * as React from 'react'

import { PrimaryButton, Icon } from '@opentrons/components'
import styles from './upload-panel.css'

export interface UploadInputProps {
  onUpload: React.FormEventHandler | React.DragEventHandler
  isButton?: boolean
}

export function UploadInput(props: UploadInputProps): JSX.Element {
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
