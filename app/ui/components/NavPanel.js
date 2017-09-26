import React from 'react'
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom'

import Button from './Button'
import styles from './NavPanel.css'

const UploadPanel = props => {
  const recentFiles = ['bradford_assay.py', '384_plate_filling.py', 'dilution_PCR.py'] // should come from props/state
  const files = recentFiles.map((file, index) => {
    return <p key={index}>{file}</p>
  })
  return (
    <div className={styles.nav_panel}>
      <section className={styles.choose_file}>
        <button className={styles.btn_new}>
          New File
        </button>
        <label className={styles.btn_upload}>
          Upload
          <input
            className={styles.file}
            type='file'
            onChange={props.onUpload}
          />
        </label>
        <h2 className={styles.title}>Recently Uploaded</h2>
        {files}
      </section>
    </div>
  )
}

const SetupPanel = props => {
  return (
    <div className={styles.nav_panel}>
      <section className={styles.links}>
        <Link to='/setup/instruments'>Set Up Pipettes</Link>
        <Link to='/setup/labware'>Set Up Labware</Link>
        <Link to='/run'>Run</Link>
      </section>
    </div>
  )
}

const ConnectPanel = props => {
  const {isConnected, onConnectClick, onDisconnectClick} = props
  let connectButton
  let connectionStatus
  if (!isConnected) {
    connectButton =
      <Button
        onClick={onConnectClick}
        disabled={isConnected}
        style={styles.btn_connect}
      >
        Connect To Robot
      </Button>
    connectionStatus = <h2 className={styles.title}> Robot Detected</h2> // what if no robot detected?
  } else {
    connectButton =
      <Button
        onClick={onDisconnectClick}
        disabled={!isConnected}
        style={styles.btn_connect}
      >
        Disconnect Robot
      </Button>
    connectionStatus = <h2 className={styles.title}> Robot Connected</h2>
  }
  return (
    <div className={styles.nav_panel}>
      <section className={styles.connection_info}>
        {connectionStatus}
      </section>
      <section className={styles.connection_toggle}>
        {connectButton}
      </section>
    </div>
  )
}

ConnectPanel.propTypes = {
  isConnected: PropTypes.bool.isRequired,
  onConnectClick: PropTypes.func.isRequired,
  onDisconnectClick: PropTypes.func.isRequired
}

const panel = (props) => ({
  upload: <UploadPanel {...props} />,
  connect: <ConnectPanel {...props} />,
  setup: <SetupPanel {...props} />,
  design: <div>design...</div>
})

export default function NavPanel (props) {
  const {currentNavPanelTask} = props

  return (
    <div>
      {panel(props)[currentNavPanelTask]}
    </div>
  )
}

NavPanel.propTypes = {
  isConnected: PropTypes.bool.isRequired,
  currentNavPanelTask: PropTypes.string.isRequired,
  onUpload: PropTypes.func.isRequired
}
