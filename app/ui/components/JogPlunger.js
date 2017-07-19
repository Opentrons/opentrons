import React, { Component } from 'react'
import styles from './Jog.css'

export default class JogPlunger extends Component {
  render() {
    return (
      <section className={styles.plunger}>

        <h2 className={styles.title_plunger}>Plunger Jog</h2>
        <div className={styles.jog_ab}>
          <h2 className={styles.title_b}>B</h2>
          <button className={styles.b_neg}>&uarr;</button>
          <button className={styles.b_pos}>&darr;</button>

          <h2 className={styles.title_a}>A</h2>
          <button className={styles.a_neg}>&uarr;</button>
          <button className={styles.a_pos}>&darr;</button>

        </div>
        <div className={styles.increment_ab} />

      </section>
    )
  }
}
