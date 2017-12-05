import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import styles from './UploadPanel.css'

UploadPanel.propTypes = {
  onUpload: PropTypes.func.isRequired
}

export default function UploadPanel (props) {
  const {isSessionLoaded} = props
  let warning
  if (isSessionLoaded) {
    warning = (
      <div className={styles.confirm_reupload}>
        <h3>Warning:</h3>
        <p>Opening a new protocol will close the one you currently have open.
         This will clear out current calibration data.</p>
      </div>
    )
  }

  return (
    <section className={styles.upload_panel}>
      <label className={classnames('btn', 'btn_dark', styles.btn_upload)}>
        Upload
        <input
          className={styles.file}
          type='file'
          onChange={props.onUpload}
        />
      </label>

      <label className={styles.file_drop} onDrop={props.onUpload}>
       Drag and drop protocol
          file here.
        <input
          className={styles.file}
          type='file'
          onChange={props.onUpload}
        />
      </label>
      {warning}
    </section>
  )
}
