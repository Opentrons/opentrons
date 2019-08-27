// @flow
import * as React from 'react'
import { PrimaryButton, Icon } from '@opentrons/components'
import styles from './importLabware.css'

type Props = {|
  onUpload: (
    SyntheticInputEvent<HTMLInputElement> | SyntheticDragEvent<*>
  ) => void,
|}

type UploadInputProps = {|
  onUpload: $PropertyType<Props, 'onUpload'>,
  isButton?: boolean,
|}

export default function ImportLabware(props: Props) {
  return (
    <div className={styles.upload_group}>
      <UploadInput onUpload={props.onUpload} />
      <UploadInput onUpload={props.onUpload} isButton />
    </div>
  )
}

function UploadInput(props: UploadInputProps) {
  const { isButton, onUpload } = props

  const Label = isButton ? PrimaryButton : 'label'

  const labelText = isButton
    ? 'upload labware file'
    : 'Drag and drop labware file here'

  const labelProps = isButton
    ? {
        Component: 'label',
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
