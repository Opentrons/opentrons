// nav bar component
import React from 'react'

import NavButton from './NavButton'
import styles from './nav.css'

import {PANELS} from '../../interface'

export default function NavBar (props) {
  return (
    <nav className={styles.navbar}>
      {PANELS.map((panel) => <NavButton key={panel.name} {...panel} />)}
    </nav>
  )
}
