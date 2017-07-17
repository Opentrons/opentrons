import React, { Component } from 'react'
import styles from './Connect.css'

export default class Connect extends Component {
  render() {
    const connections = this.props.connections || [1, 2, 3, 4, 5]
    return (
      <select className={styles.ports}>
        {connections.map((port) =>
          <option key={port}>{port}</option>
        )}
      </select>
    )
  }
}
