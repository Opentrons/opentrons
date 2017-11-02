import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Button from './Button'
import DiscoveredRobot from '../containers/DiscoveredRobot'
import {Spinner} from './icons'
import styles from './ConnectPanel.css'

ConnectPanel.propTypes = {
  isScanning: PropTypes.bool.isRequired,
  isConnected: PropTypes.bool.isRequired,
  onScanClick: PropTypes.func.isRequired,
  discovered: PropTypes.array.isRequired
}

export default function ConnectPanel (props) {
  const {
    isScanning,
    onScanClick,
    discovered
  } = props

  const robotList = discovered.map((robot) => (
    <DiscoveredRobot key={robot.hostname} {...robot} />
  ))

  const scanInProgress = isScanning
    ? (<li><Spinner className={styles.spinner} /></li>)
    : null

  // TODO: (KA 20171026)refactor into searching status component
  let searchStyles
  let discoveredRobots
  if (!isScanning && discovered.length === 0) {
    discoveredRobots = (
      <div className={styles.robots_unfound}>
        <h2>No robots found</h2>
        <p>Connect a robot via USB to use or setup WiFi</p>
        <Button
          style={classnames(styles.btn_refresh, styles.btn_large)}
          onClick={onScanClick}
        >
          &#x21ba;
        </Button>
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
      <button className={styles.refresh_icon} onClick={onScanClick}>
        &#x21ba;
      </button>
      <section className={searchStyles}>
        {discoveredRobots}
      </section>
    </div>
  )
}
