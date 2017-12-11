import React from 'react'
import PropTypes from 'prop-types'
import styles from './upload-panel.css'

UploadInput.propTypes = {
  onUpload: PropTypes.func.isRequired,
  isButton: PropTypes.bool
}

export default function UploadInput (props) {
  const {isButton, onUpload} = props
  const style = isButton
    ? styles.btn_upload
    : styles.file_drop
  const label = isButton
    ? 'Open'
    : 'Drag and drop protocol file here.'

  return (
    <label className={style} onDrop={onUpload}>
      {label}
      <input
        className={styles.file}
        type='file'
        onChange={onUpload}
      />
    </label>
  )
}
