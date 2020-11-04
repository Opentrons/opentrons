// @flow
// top nav bar logo image
import * as React from 'react'

import styles from './MainNav.module.css'

export function Logo(): React.Node {
  return (
    <a href="https://opentrons.com/">
      <img
        className={styles.logo}
        src="https://s3.amazonaws.com/opentrons-images/website/ot_logo_full.png"
      />
    </a>
  )
}
