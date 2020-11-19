// @flow
// top nav bar logo image
import * as React from 'react'
import logo from './images/ot-logo-full.png'

import styles from './MainNav.module.css'

export function Logo(): React.Node {
  return (
    <a href="https://www.opentrons.com/">
      <img className={styles.logo} src={logo} />
    </a>
  )
}
