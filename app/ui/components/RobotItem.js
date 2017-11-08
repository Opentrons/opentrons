import React from 'react'
import classnames from 'classnames'
import PropTypes from 'prop-types'

import Button from './Button'
import {ControlledUSB, AvailableUSB} from './icons'
import styles from './ConnectPanel.css'

RobotItem.propTypes = {
  name: PropTypes.string.isRequired,
  isConnected: PropTypes.bool.isRequired,
  onConnectClick: PropTypes.func,
  onDisconnectClick: PropTypes.func
}

export default function RobotItem (props) {
  const {name, isConnected, onConnectClick, onDisconnectClick} = props
  let connectionToggle
  let connectionStatus

  if (isConnected) {
    connectionStatus = <ControlledUSB className={styles.connection_type} />
    connectionToggle = (
      <span>
        <Button
          onClick={onDisconnectClick}
          style={classnames('btn', 'btn_dark', styles.btn_connect)}
        >
          Disconnect Robot
        </Button>
      </span>
    )
  } else {
    connectionStatus = <AvailableUSB className={styles.connection_type} />
    connectionToggle = (
      <Button
        onClick={onConnectClick}
        style={classnames('btn', 'btn_dark', styles.btn_connect)}
      >
        Connect to Robot
      </Button>
    )
  }

  return (
    <li>
      {connectionStatus}
      <div className={styles.connection_info}>
        <span className={styles.connection_name}>{name}</span>
        <span className={styles.connection_btn}>{connectionToggle}</span>
      </div>
    </li>
  )
}
