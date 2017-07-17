import React, { Component } from 'react'
import styles from './Connect.css'

export default class Connect extends Component {
  render() {
    // const { connect } = this.props
    return (
      <select className={styles.ports}>
        <option>select port</option>
        <option>port 1</option>
        <option>port 2</option>
      </select>
    )
  }
}
