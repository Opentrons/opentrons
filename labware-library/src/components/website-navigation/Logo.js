// @flow
// top nav bar logo image
import * as React from 'react'

import logoSrc from './images/ot-logo-full.png'
import styles from './styles.css'

export default function Logo() {
  return (
    <a href="https://opentrons.com/" target="_blank" rel="noopener noreferrer">
      <img className={styles.logo} src={logoSrc} />
    </a>
  )
}
