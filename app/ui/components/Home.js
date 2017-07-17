import React, { Component } from 'react'
import styles from './Home.css'

export default class Home extends Component {
  render() {
    const { home } = this.props
    return (
      <div className={styles.home}>
        <button className={styles.btn} onClick={() => home('all')} >All</button>
        <button className={styles.btn} onClick={() => home('x')} >x</button>
        <button className={styles.btn} onClick={() => home('y')} >y</button>
        <button className={styles.btn} onClick={() => home('z')} >z</button>
        <button className={styles.btn} onClick={() => home('a')} >a</button>
        <button className={styles.btn} onClick={() => home('b')} >b</button>  
      </div>
    )
  }
}
