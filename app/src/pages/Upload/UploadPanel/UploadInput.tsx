import * as React from 'react'

import { PrimaryButton, Icon } from '@opentrons/components'
import styles from './upload-panel.css'

export interface UploadInputProps {
  onUpload: React.EventHandler<React.MouseEvent | React.ChangeEvent>
  isButton?: boolean
}

export function UploadInput(props: UploadInputProps): JSX.Element {
  const { isButton, onUpload } = props

  const Label = isButton ? PrimaryButton : 'label'

  const labelText = isButton ? 'Open' : 'Drag and drop protocol file here'

  const labelProps = isButton
    ? {
        Component: 'label' as React.ComponentProps<
          typeof PrimaryButton
        >['Component'],
        iconName: 'ot-file' as React.ComponentProps<
          typeof PrimaryButton
        >['iconName'],
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
