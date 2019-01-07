// @flow
import React from 'react'
import cx from 'classnames'
import styles from './labware.css'

const DisabledSelectSlotOverlay = () => (
  <g className={cx(styles.slot_overlay, styles.disabled)}>
    <rect className={styles.overlay_panel} />
    <g className={styles.clickable_text}>
      <text x="-7%" y="40%">Drag to New Slot</text>
    </g>
  </g>
)

export default DisabledSelectSlotOverlay
