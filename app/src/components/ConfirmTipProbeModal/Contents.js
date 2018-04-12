// @flow
// contents of the ContinueTipProbeModal container
import * as React from 'react'

import removeTrashSrc from './trash@3x.png'
import styles from './Contents.css'

export default function () {
  return (
    <div>
      <p className={styles.attention}>
        Before continuing remove from deck:
      </p>
      <ol className={styles.list}>
        <li>
          All labware
        </li>
        <li>
          Trash bin
        </li>
      </ol>
      <img className={styles.diagram} src={removeTrashSrc} />
    </div>
  )
}
