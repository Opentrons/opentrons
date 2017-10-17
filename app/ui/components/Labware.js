import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import {Spinner} from './icons'
import styles from './Labware.css'

Labware.propTypes = {
  slot: PropTypes.number.isRequired,
  type: PropTypes.string,
  isConfirmed: PropTypes.bool,
  isCurrent: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isMoving: PropTypes.bool
}

export default function Labware (props) {
  const {
    type,
    slot,
    labwareReviewed,
    isConfirmed,
    isCurrent,
    isDisabled,
    isMoving
  } = props

  const slotStyle = {gridArea: `slot-${slot}`}

  if (!type) {
    return (
      <div style={slotStyle} className={styles.empty_slot}>{slot}</div>
    )
  }

  const style = classnames(styles.slot, {
    [styles.confirmed]: isConfirmed,
    [styles.active]: isCurrent && !isMoving,
    [styles.disabled]: isDisabled,
    [styles.confirmed]: isConfirmed && !isMoving
  })

  const confirmationMsg = (!isConfirmed && labwareReviewed && !isCurrent)
    ? (<div className={styles.status}>Position Unconfirmed</div>)
    : null

  const confirmationFade = (labwareReviewed && isConfirmed && isCurrent)
  ? (<div className={styles.confirmed_fade}>Confirmed</div>)
  : null

  const labwareLabel = !labwareReviewed
    ? (<div className={styles.label}>{type}</div>)
    : null

  const movingNotification = (isMoving && isCurrent)
    ? (
      <div className={styles.moving}>
        <Spinner className={styles.spinner} />
      </div>
    )
    : null

  return (
    <div style={slotStyle} className={style} data-lab={type}>
      {labwareLabel}
      {confirmationMsg}
      {movingNotification}
      {confirmationFade}
    </div>
  )
}
