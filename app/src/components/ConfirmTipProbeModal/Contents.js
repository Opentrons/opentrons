// @flow
// contents of the ContinueTipProbeModal container
import * as React from 'react'

import styles from './Contents.css'

export default function () {
  return (
    <div>
      <p className={styles.attention}>
        Before continuing:
      </p>
      <ol className={styles.list}>
        <li>
          Remove all labware from the deck
        </li>
        <li>
          Remove the trash bin cover
        </li>
      </ol>
    </div>
  )
}
