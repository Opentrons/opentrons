import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import {Spinner} from './icons'
import styles from './Labware.css'

import {constants as robotConstants} from '../robot'

const {UNCONFIRMED, MOVING_TO_SLOT, OVER_SLOT, CONFIRMED} = robotConstants

Labware.propTypes = {
  slot: PropTypes.number.isRequired,
  type: PropTypes.string,
  isCurrent: PropTypes.bool,
  isDisabled: PropTypes.bool,
  calibration: PropTypes.oneOf([
    UNCONFIRMED,
    MOVING_TO_SLOT,
    OVER_SLOT,
    CONFIRMED
  ])
}

export default function Labware (props) {
  const {
    type,
    slot,
    labwareReviewed,
    isCurrent,
    isDisabled,
    calibration
  } = props

  const isMoving = calibration === MOVING_TO_SLOT
  const isConfirmed = calibration === CONFIRMED
  const isUnconfirmed = calibration === UNCONFIRMED
  const slotStyle = {gridArea: `slot-${slot}`}

  if (!type) {
    return (
      <div style={slotStyle} className={styles.empty_slot}>{slot}</div>
    )
  }

  const style = labwareReviewed
    ? classnames(styles.slot, {
      [styles.active]: isCurrent && !isMoving,
      [styles.disabled]: isDisabled,
      [styles.confirmed]: isConfirmed && !isCurrent
    })
    : styles.slot

  const confirmationMsg = (labwareReviewed && isUnconfirmed)
    ? (<div className={styles.status}>Position Unconfirmed</div>)
    : null

  const confirmationFade = (isConfirmed && isCurrent && labwareReviewed)
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
