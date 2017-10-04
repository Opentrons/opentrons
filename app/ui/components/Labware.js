import React from 'react'
import classnames from 'classnames'
import {NavLink} from 'react-router-dom'
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
  const url = `/setup-deck/${slot}`
  let slotStyle = {
    gridArea: `slot-${slot}`
  }
  let confirmationMsg
  if (!isConfirmed) {
    confirmationMsg = <div>Position Unconfirmed</div>
  }
  // const isSelected = slot === currentSlot
  if (type) {
    const disabled = !isTipracksConfirmed && !isTiprack
    return (

      <NavLink to={url}
        style={slotStyle}
        activeClassName={styles.active}
        className={classnames({[styles.disabled]: disabled}, styles.slot)}
      >
        {name}
        {currentSlot}
        {confirmationMsg}
      </NavLink>
    )
  } else {
    return (
      <div style={slotStyle} className={styles.empty_slot}>{slot}</div>
    )
  }
}
