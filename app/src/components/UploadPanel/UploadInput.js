// @flow
import * as React from 'react'

import {PrimaryButton, Icon, FILE, UPLOAD} from '@opentrons/components'
import styles from './upload-panel.css'

type Props = {
  onUpload: (SyntheticEvent<>) => void,
  isButton?: boolean
}

export default function UploadInput (props: Props) {
  const {isButton, onUpload} = props

  const Label = isButton
    ? PrimaryButton
    : 'label'

  const labelText = isButton
    ? 'Open'
    : 'Drag and drop protocol file here'

  const labelProps = isButton
    ? {Component: 'label', iconName: FILE, className: styles.upload_button}
    : {onDrop: onUpload, className: styles.file_drop}

  return (
    <div className={styles.upload}>
      <Label {...labelProps}>
        {!isButton && (
          <Icon name={UPLOAD} className={styles.file_drop_icon} />
        )}
        {labelText}
        <input
          className={styles.file_input}
          type='file'
          onChange={onUpload}
        />
      </Label>
    </div>
  )
}
