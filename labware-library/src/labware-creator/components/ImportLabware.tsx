import * as React from 'react'
import { DeprecatedPrimaryButton, Icon } from '@opentrons/components'
import styles from './importLabware.module.css'

interface Props {
  onUpload: React.DragEventHandler<HTMLLabelElement> &
    React.ChangeEventHandler<HTMLInputElement>
}

interface UploadInputProps {
  onUpload: Props['onUpload']
  isButton?: boolean
}

export function ImportLabware(props: Props): JSX.Element {
  return (
    <div className={styles.upload_group}>
      <UploadInput onUpload={props.onUpload} />
      <UploadInput onUpload={props.onUpload} isButton />
    </div>
  )
}

const stopEvent = (e: React.SyntheticEvent): void => e.preventDefault()

function UploadInput(props: UploadInputProps): JSX.Element {
  const { isButton, onUpload } = props

  const Label = isButton ? DeprecatedPrimaryButton : 'label'

  const labelText = isButton
    ? 'upload labware file'
    : 'Drag and drop labware file here'

  const labelProps = isButton
    ? {
        Component: 'label' as const,
        className: styles.upload_button,
      }
    : { onDrop: onUpload, className: styles.file_drop }

  return (
    <div className={styles.upload} onDragOver={stopEvent} onDrop={stopEvent}>
      <Label {...labelProps}>
        {!isButton && <Icon name="upload" className={styles.file_drop_icon} />}
        <span className={styles.label_text}>{labelText}</span>
        <input className={styles.file_input} type="file" onChange={onUpload} />
      </Label>
    </div>
  )
}
