import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Button from './Button'
import DiscoveredRobot from '../containers/DiscoveredRobot'
import {Spinner} from './icons'
import styles from './ConnectPanel.css'

export default function ConnectPanel (props) {
  const {
    scanning,
    isConnected,
    discovered
  } = props

  const robotList = discovered.map((robot) => {
    const {hostname} = robot
    return (
      <DiscoveredRobot
        robot={robot}
        isConnected={isConnected}
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
