import React, { Component } from 'react'
import JogPipette from './JogPipette'
import JogPlunger from './JogPlunger'
import styles from './Welcome.css'

class Welcome extends Component {
  render () {
    return (
      <div className={styles.welcome}>
        <div className={styles.jog}>
          <JogPipette />
          <JogPlunger />
        </div>
      </div>
    )
  }
}

export default Welcome
