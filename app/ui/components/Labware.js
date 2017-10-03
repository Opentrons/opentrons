import React from 'react'
import classnames from 'classnames'

import styles from './Labware.css'

export default function Labware (props) {
  let {
    type,
    name,
    slot,
    currentSlot,
    isConfirmed,
    isTipracksConfirmed,
    isTiprack
  } = props
  // const url = `/setup-deck/${slot}`
  let slotStyle = {
    gridArea: `slot-${slot}`
  }
  let confirmationMsg
  if (!isConfirmed) {
    confirmationMsg = <div>Position Unconfirmed</div>
  }

  const isSelected = slot === currentSlot
  if (type) {
    const disabled = !isTipracksConfirmed && !isTiprack
    return (

      <div
        style={slotStyle}
        className={classnames({[styles.disabled]: disabled, [styles.selected]: isSelected}, styles.slot)}
      >
        {name}
        {confirmationMsg}
      </div>
    )
  } else {
    return (
      <div style={slotStyle} className={styles.empty_slot}>{slot}</div>
    )
  }
}
