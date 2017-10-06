import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import styles from './Labware.css'

Labware.propTypes = {
  slot: PropTypes.number.isRequired,
  type: PropTypes.string,
  isConfirmed: PropTypes.bool,
  isCurrent: PropTypes.bool,
  isDisabled: PropTypes.bool
}

export default function Labware (props) {
  const {
    type,
    slot,
    labwareReviewed,
    isConfirmed,
    isCurrent,
    isDisabled
  } = props

  const slotStyle = {gridArea: `slot-${slot}`}

  if (!type) {
    return (
      <div style={slotStyle} className={styles.empty_slot}>{slot}</div>
    )
  }

  const style = classnames(styles.slot, {
    [styles.active]: isCurrent,
    [styles.disabled]: isDisabled
  })

  const confirmationMsg = (!isConfirmed && labwareReviewed)
    ? (<div className={styles.status}>Position Unconfirmed</div>)
    : null

  const labwareLabel = !labwareReviewed
    ? (<div className={styles.label}>{type}</div>)
    : null

  return (
    <div style={slotStyle} className={style}>
      <img src={require(`../img/labware/${type}.png`)} />
      {labwareLabel}
      {confirmationMsg}
    </div>
  )
}
