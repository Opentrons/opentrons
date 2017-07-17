import React, { Component } from 'react'
import styles from './Connect.css'

export default class Connect extends Component {
  render() {
    // const { connect } = this.props
    const ports = [1, 2, 3, 4, 5] // TODO: move this up as prop
    return (
      <select className={styles.ports}>
        {ports.map((port) =>
          <option key={port}>{port}</option>
        )}
      </select>
    )
  }
}
