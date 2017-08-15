import React, { Component } from 'react'
import styles from './Jog.css'

export default class JogPlunger extends Component {
  render () {
    const axis = [
      {
        name: 'b_neg',
        content: '\u2191',
        direction: -1
      },
      {
        name: 'b_pos',
        content: '\u2193',
        direction: 1
      },
      {
        name: 'a_neg',
        content: '\u2191',
        direction: -1
      },
      {
        name: 'a_pos',
        content: '\u2193',
        direction: 1
      }
    ]
    return (
      <section className={styles.plunger}>

        <h2 className={styles.title_plunger}>Plunger Jog</h2>
        <div className={styles.jog_ab}>
          <h2 className={styles.title_b}>B</h2>
          <h2 className={styles.title_a}>A</h2>

          {axis.map((a) =>
            <button key={a.name} className={styles[a.name]}>{a.content}</button>
          )}

        </div>
        <div className={styles.increment_ab} />

      </section>
    )
  }
}
