// nav bar component
import React from 'react'

import NavButton from './NavButton'
import styles from './nav-bar.css'

// TODO(mc, 2017-11-09): move to central location (interface/index.js?)
const PANELS = [
  {name: 'upload', title: 'Upload File'},
  {name: 'setup', title: 'Prep for Run'},
  {name: 'connect', title: 'Connect to a Robot'}
]

export default function NavBar (props) {
  return (
    <nav className={styles.navbar}>
      {PANELS.map((panel) => <NavButton key={panel.name} {...panel} />)}
    </nav>
  )
}
