// TODO(mc): maybe put this robot specific component in ui/robot/components
import React from 'react'
import PropTypes from 'prop-types'
import Button from './Button'
import styles from './ConnectionPanel.css'

const ConnectionIndicator = props => {
  const {isConnected} = props

  // TODO(mc): handle connection in progress (state is in place for this)
  const style = isConnected
    ? styles.connected
    : styles.disconnected

  return (
    <div className={styles.connection_status}>
      <div className={styles.status}>
        <div className={style} />
      </div>
    </div>
  )
}

ConnectionIndicator.propTypes = {
  isConnected: PropTypes.bool.isRequired
}

const ConnectionInfo = props => {
  const {isConnected, connectionStatus, onConnectButtonClick} = props
  let statusMessage = {
    connected: 'available',
    disconnected: 'unavailable',
    updating: 'updating'
  }
  if (!isConnected) {
    return (
      <div className={styles.connect}>
        <Button
          onClick={onConnectButtonClick}
          disabled={isConnected}
          style={styles.connect_btn}
        >
          Connect To Robot
        </Button>
      </div>
    )
  } else {
    return (
      <div className={styles.connect}>
        <div className={styles.location}>connection location</div>
        <div className={styles.msg}>Status: <span className={styles.connection_type}>{statusMessage[connectionStatus]}</span> </div>
        <Button
          onClick={() => console.log('disconnect')}
          disabled={!isConnected}
          style={styles.connect_btn}
        >
          Disconnect Robot
        </Button>
      </div>
    )
  }
}

ConnectionInfo.propTypes = {
  isConnected: PropTypes.bool.isRequired,
  connectionStatus: PropTypes.string.isRequired,
  onConnectButtonClick: PropTypes.func.isRequired
}

export default function ConnectionPanel (props) {
  return (
    <div className={styles.connection_panel}>
      <ConnectionIndicator {...props} />
      <ConnectionInfo {...props} />
    </div>
  )
}
