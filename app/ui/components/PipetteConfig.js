import React from 'react'
import styles from './PipetteConfig.css'

export default function PipetteConfig (props) {
  const {side} = props
  return (
    <section className={styles.pipette_group}>
      <div className={styles.pipette_wrapper}>
        <button className={styles.pipette_toggle}>{side}</button>
      </div>
      <h3 className={styles.title}>Pipette</h3>
    </section>
  )
}
