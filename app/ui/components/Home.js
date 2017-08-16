import React, { Component } from 'react'
import styles from './Home.css'

export default class Home extends Component {
  render () {
    const axis = this.props.home || ['all', 'x', 'y', 'z', 'a', 'b']
    return (
      <div className={styles.home}>
        {axis.map((a) =>
          <button key={a} className={styles.btn} onClick={() => home({ a })}>{a}</button>
        )}
      </div>
    )
  }
}
