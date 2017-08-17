import React from 'react'
import Button from './Button'
import styles from './ConnectionInfo.css'

export default function ConnectionInfo (props) {
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
        <div className={styles.msg}>Status: <span className={styles.status}>{statusMessage[connectionStatus]}</span> </div>
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
