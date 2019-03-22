// @flow
// top nav bar component
import * as React from 'react'

import Logo from './Logo'
import styles from './styles.css'

export default function Nav () {
  return (
    <nav className={styles.nav}>
      <div className={styles.nav_contents}>
        <Logo />
      </div>
    </nav>
  )
}
