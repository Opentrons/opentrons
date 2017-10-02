import React from 'react'
import PropTypes from 'prop-types'
import {Link} from 'react-router-dom'
import ConnectedSetupPanel from '../containers/ConnectedSetupPanel'
import Button from './Button'
import styles from './NavPanel.css'

const UploadPanel = props => {
  return (
    <div className={styles.nav_panel}>
      <section className={styles.choose_file}>
        <label className={styles.btn_upload}>
          Upload
          <input
            className={styles.file}
            type='file'
            onChange={props.onUpload}
          />
        </label>
        <h2 className={styles.title}>Recently Uploaded</h2>
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
  setup: <ConnectedSetupPanel />,
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
