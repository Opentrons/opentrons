import React from 'react'
// import classnames from 'classnames'
import Button from './Button'

import styles from './ConnectPanel.css'

function RobotItem (props) {
  const {hostname, isConnected, onConnectClick, onDisconnectClick} = props
  let connectButton
  if (!isConnected) {
    connectButton =
      <Button
        onClick={onConnectClick}
        disabled={isConnected}
        style={styles.btn_connect}
      >
        Take Control
      </Button>
  } else {
    connectButton =
      <Button
        onClick={onDisconnectClick}
        disabled={!isConnected}
        style={styles.btn_connect}
      >
        Release Control
      </Button>
  }
  return (
    <li>
      <div>{hostname}</div>
      {connectButton}
    </li>
  )
}

export default function ConnectPanel (props) {
  const {
    isConnected,
    onConnectClick,
    onDisconnectClick,
    discovered
  } = props

  const robotList = discovered.map((robot) => {
    const {hostname} = robot
    const connectBtnProps = {
      isConnected,
      onConnectClick,
      onDisconnectClick
    }
    return (
      <RobotItem
        {...robot}
        {...connectBtnProps}
        key={hostname}
      />
    )
  })

  return (
    <div className={styles.connect_panel}>
      <h1>Connect to a Robot</h1>
      <button className={styles.refresh}>&#x21ba;</button>
      <ol className={styles.robot_list}>
        {robotList}
      </ol>
    </div>
  )
}
