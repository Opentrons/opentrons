import React from 'react'
import classnames from 'classnames'
import {NavLink} from 'react-router-dom'
import styles from './Labware.css'

export default function Labware (props) {
  let {
    type,
    slot,
    isDeckmapReviewed,
    isConfirmed,
    isTipracksConfirmed,
    isTiprack
  } = props
  const url = `/setup-deck/${slot}`
  let slotStyle = {
    gridArea: `slot-${slot}`
  }
  let confirmationMsg
  if (!isConfirmed && isDeckmapReviewed) {
    confirmationMsg = <div className={styles.status}>Position Unconfirmed</div>
  }

  let labwareLabel
  !isDeckmapReviewed
  ? labwareLabel = <div className={styles.label}>{type}</div>
  : labwareLabel = null

  if (type) {
    const disabled = !isTipracksConfirmed && !isTiprack
    return (

      <NavLink to={url}
        style={slotStyle}
        activeClassName={styles.active}
        className={classnames({[styles.disabled]: disabled}, styles.slot)}
      >
        {labwareLabel}
        {confirmationMsg}
      </NavLink>
    )
  } else {
    return (
      <div style={slotStyle} className={styles.empty_slot}>{slot}</div>
    )
  }
}
