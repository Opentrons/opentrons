import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Button from './Button'
import {Spinner} from './icons'
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
    scanning,
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
  const scanInProgress = scanning
    ? (<li><Spinner className={styles.spinner} /></li>)
    : null

  // TODO: (KA 20171026)refactor into searching status component
  let searchStyles
  let discoveredRobots
  if (!scanning && discovered.length === 0) {
    discoveredRobots = (
      <div className={styles.robots_unfound}>
        <h2>No robots found</h2>
        <p>Connect a robot via USB to use or setup WiFi</p>
        <Button
          style={styles.btn_refresh}
        >
          &#x21ba;
        </Button>
      </div>
    )
  } else if (scanning && discovered.length === 0) {
    searchStyles = classnames(styles.robot_results, styles.centered)
    discoveredRobots = (
      <div className={searchStyles}>
        <Spinner className={styles.spinner} />
      </div>
    )
  } else {
    searchStyles = classnames(styles.robot_results)
    discoveredRobots = (
      <ol className={styles.robot_list}>
        {robotList}
        {scanInProgress}
      </ol>
    )
  }

  return (
    <div className={styles.connect_panel}>
      <h1>Connect to a Robot</h1>
      <button className={styles.refresh}>&#x21ba;</button>
      <section className={searchStyles}>
        {discoveredRobots}
      </section>
    </div>
  )
}

ConnectPanel.propTypes = {
  isConnected: PropTypes.bool.isRequired,
  onConnectClick: PropTypes.func.isRequired,
  onDisconnectClick: PropTypes.func.isRequired
}
