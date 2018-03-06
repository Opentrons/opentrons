import React from 'react'
import styles from './upload-panel.css'

// TODO(ka 2017-12-6) revist post design screens ? convert to warning prompt component
export default function UploadWarning (props) {
  return (
    <div className={styles.upload_warning}>
      <h3 className={styles.upload_warning_title}>
        Warning
      </h3>
      <p className={styles.upload_warning_body}>
        Opening a new protocol will close the one you currently have open.
        This will clear out current calibration data.
      </p>
    </div>
  )
}
