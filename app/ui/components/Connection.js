import React, { Component } from 'react'
import styles from './Connection.css'

export default class Connection extends Component {
  render() {
    const connectionStatusStyles = {
      connected: styles.connected,
      disconnected: styles.disconnected
    }
    const status = this.props.connectionStatus || 'connected'
    return (
      <div className={styles.status}>
        <div className={connectionStatusStyles[status]} />
        <div className={styles.msg}> Device {status}</div>
      </div>
    )
  }
}
