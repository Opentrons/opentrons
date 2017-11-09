// nav bar component
import React from 'react'

import NavButton from './NavButton'
import styles from './nav-bar.css'

const PANELS = [
  {name: 'upload', title: 'Upload File'},
  {name: 'setup', title: 'Prep for Run'},
  {name: 'connect', title: 'Connect Robot'}
]

export default function NavBar (props) {
  return (
    <nav className={styles.navbar}>
      {PANELS.map((panel) => <NavButton key={panel.name} {...panel} />)}
    </nav>
  )
}
