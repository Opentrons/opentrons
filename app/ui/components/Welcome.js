import React, { Component } from 'react'
import Jog from './Jog'
import styles from './Welcome.css'

class Welcome extends Component {
  render() {
    return (
      <div className={styles.welcome}>
        <Jog className={styles.jog} />
      </div>
    )
  }
}

export default Welcome
