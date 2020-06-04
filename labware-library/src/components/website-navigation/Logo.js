// @flow
// top nav bar logo image
import * as React from 'react'

import logoSrc from './images/ot-logo-full.png'
import styles from './styles.css'

export function Logo(): React.Node {
  return (
    <a
      href="https://opentrons.com/"
      target="_blank"
      rel="noopener noreferrer"
      data-gtm-category="l-header"
      data-gtm-label="logo"
      data-gtm-action="click"
    >
      <img className={styles.logo} src={logoSrc} />
    </a>
  )
}
