import React, { Component } from 'react'
import styles from './Jog.css'

export default class JogPipette extends Component {
  render () {
    const axis = [
      {
        name: 'x_neg',
        content: '\u2190',
        direction: -1
      },
      {
        name: 'x_pos',
        content: '\u2192',
        direction: 1
      },
      {
        name: 'y_neg',
        content: '\u2191',
        direction: -1
      },
      {
        name: 'y_pos',
        content: '\u2193',
        direction: 1
      },
      {
        name: 'z_neg',
        content: '\u2191',
        direction: -1
      },
      {
        name: 'z_pos',
        content: '\u2193',
        direction: 1
      }
    ]
    return (
      <section className={styles.pipette}>
        <h2 className={styles.title_pipette}>Pipette Jog</h2>
        <div className={styles.jog_xyz}>
          <h2 className={styles.title_xy}>X-Y</h2>
          <h2 className={styles.title_z}>Z</h2>

          {axis.map((a) =>
            <button key={a.name} className={styles[a.name]}>{a.content}</button>
          )}
        </div>

        <div className={styles.increment_xyz} />

      </section>
    )
  }
}
