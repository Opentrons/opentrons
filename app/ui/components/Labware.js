import React from 'react'
import classnames from 'classnames'
import styles from './Labware.css'

export default function Labware (props) {
  const {
    type,
    slot,
    isDeckmapReviewed,
    isConfirmed,
    isTipracksConfirmed,
    isTiprack
  } = props
  const slotStyle = {
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
      <div
        style={slotStyle}
        className={classnames({[styles.disabled]: disabled}, styles.slot)}
      >
        <img src={require(`../img/labware/${type}.png`)} />
        {labwareLabel}
        {confirmationMsg}
      </div>
    )
  }
  return (
    <div style={slotStyle} className={styles.empty_slot}>{slot}</div>
  )
}
