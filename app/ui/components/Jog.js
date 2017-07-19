import React, { Component } from 'react'
import styles from './Jog.css'

export default class Jog extends Component {
  render() {
    return (
      <div className={styles.jog}>
        <section className={styles.pipette}>
          <h2 className={styles.title_pipette}>Pipette Jog</h2>
          <div className={styles.jog_xyz}>
            <h2 className={styles.title_xy}>X-Y</h2>

            <button className={styles.x_neg}>&larr;</button>
            <button className={styles.x_pos}>&rarr;</button>

            <button className={styles.y_neg}>&uarr;</button>
            <button className={styles.y_pos}>&darr;</button>

            <h2 className={styles.title_z}>Z</h2>

            <button className={styles.z_neg}>&uarr;</button>
            <button className={styles.z_pos}>&darr;</button>

          </div>

          <div className={styles.increment_xyz} />

        </section>
      </div>
    )
  }
}
