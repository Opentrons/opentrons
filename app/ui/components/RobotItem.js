import React from 'react'
import Button from './Button'
import {ControlledUSB, AvailableUSB} from './icons'
import styles from './ConnectPanel.css'

export default function RobotItem (props) {
  const {robot, isConnected, onConnectClick, onDisconnectClick} = props
  const {hostname, isCurrent} = robot
  let connectButton
  let connectionStatus
  if (!isConnected) {
    connectionStatus = <AvailableUSB className={styles.connection_type} />
    connectButton =
      <Button
        onClick={onConnectClick}
        style={styles.btn_connect}
      >
        Take Control
      </Button>
  } else if (isConnected && isCurrent) {
    connectionStatus = <ControlledUSB className={styles.connection_type} />
    connectButton =
      <Button
        onClick={onDisconnectClick}
        style={styles.btn_connect}
      >
        Release Control
      </Button>
  } else {
    connectionStatus = <AvailableUSB className={styles.connection_type} />
    connectButton =
      <Button
        onClick={onConnectClick}
        disabled={isConnected && !isCurrent}
        style={styles.btn_connect}
      >
        Take Control
      </Button>
  }
  return (
    <li>
      {connectionStatus}
      <div className={styles.connection_info}>
        <span className={styles.connection_name}>{hostname}</span>
        <span className={styles.connection_btn}>{connectButton}</span>
      </div>
    </li>
  )
}
