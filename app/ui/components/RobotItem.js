import React from 'react'
import classnames from 'classnames'
import Button from './Button'
import {ControlledUSB, AvailableUSB} from './icons'
import styles from './ConnectPanel.css'

export default function RobotItem (props) {
  const {robot, isConnected, onConnectClick, onDisconnectClick} = props
  const {hostname, isCurrent} = robot
  let connectionToggle
  let connectionStatus
  if (!isConnected) {
    connectionStatus = <AvailableUSB className={styles.connection_type} />
    connectionToggle =
      <Button
        onClick={onConnectClick}
        style={classnames('btn', 'btn_dark', styles.btn_connect)}
      >
        Take Control
      </Button>
  } else if (isConnected && isCurrent) {
    connectionStatus = <ControlledUSB className={styles.connection_type} />
    connectionToggle =
      <span>
        <Button
          // onClick={onSettingsClick}
          style={classnames('btn', 'btn_dark')}
          >
          Settings
        </Button>
        <Button
          onClick={onDisconnectClick}
          style={classnames('btn', 'btn_dark')}
        >
          Release Control
        </Button>
      </span>
  } else {
    connectionStatus = <AvailableUSB className={styles.connection_type} />
    connectionToggle =
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
        <span className={styles.connection_btn}>{connectionToggle}</span>
      </div>
    </li>
  )
}
