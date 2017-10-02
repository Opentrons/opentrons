import React from 'react'
import {Link} from 'react-router-dom'
import styles from './NavPanel.css'

export default function SetupPanel (props) {
  return (
    <div className={styles.nav_panel}>
      <section className={styles.links}>
        <Link to='/setup-instruments'>Set Up Pipettes</Link>
        <Link to='/setup-deck'>Set Up Labware</Link>
        <Link to='/run'>Run</Link>
      </section>
    </div>
  )
}
