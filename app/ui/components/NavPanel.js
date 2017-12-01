import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import ConnectedSetupPanel from '../containers/ConnectedSetupPanel'
import Connection from '../containers/Connection'
import styles from './NavPanel.css'

const UploadPanel = props => {
  const {isSessionLoaded} = props
  let warning
  if (isSessionLoaded) {
    warning = (
      <div className={styles.confirm_reupload}>
        <h3>Warning:</h3>
        <p>Uploading a new protocol file will clear out current calibration data.</p>
      </div>
    )
  }

  return (
    <div className={styles.nav_panel}>
      <section className={styles.choose_file}>
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

    </div>
  )
}

const PANELS_BY_NAME = {
  upload: UploadPanel,
  connect: Connection,
  setup: ConnectedSetupPanel
}

export default function NavPanel (props) {
  const {currentPanel} = props

  if (!(currentPanel in PANELS_BY_NAME)) return null

  const Panel = PANELS_BY_NAME[currentPanel]

  return (
    <Panel {...props} />
  )
}

NavPanel.propTypes = {
  currentPanel: PropTypes.string.isRequired,
  onUpload: PropTypes.func.isRequired
}
