import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import ConnectedSetupPanel from '../containers/ConnectedSetupPanel'
import Connection from '../containers/Connection'
import styles from './NavPanel.css'

const UploadPanel = props => {
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

        <label className={styles.file_drop}>
         Drag and drop protocol
            file here.
          <input
            className={styles.file}
            type='file'
            onChange={props.onUpload}
          />
        </label>

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
  const {currentNavPanelTask} = props

  if (!(currentNavPanelTask in PANELS_BY_NAME)) return null

  const Panel = PANELS_BY_NAME[currentNavPanelTask]

  return (
    <Panel {...props} />
  )
}

NavPanel.propTypes = {
  isConnected: PropTypes.bool.isRequired,
  currentNavPanelTask: PropTypes.string.isRequired,
  onUpload: PropTypes.func.isRequired
}
