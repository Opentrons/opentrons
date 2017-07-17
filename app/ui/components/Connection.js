import React, { Component } from 'react'
import styles from './Connection.css'

export default class Connection extends Component {
  render() {
    const { connectionStatus } = this.props
    return (
      <div className={styles.status}>
        <div className={styles.connected} />
      </div>
    )
  }
}
