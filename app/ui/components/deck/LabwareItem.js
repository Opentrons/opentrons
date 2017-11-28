import React from 'react'
import {NavLink} from 'react-router-dom'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import {Spinner} from '../icons'
import styles from './labwareitem.css' // Labware should have own styles once SVG wells generated

import {constants as robotConstants} from '../../robot'

// TODO: import image vars from separate file
import plateImgSrc from '../../img/labware/deckmap/96-PCR-flat.png'
import plateImgSrcActive from '../../img/labware/deckmap/96-PCR-flat-active.png'
import tiprackImgSrc from '../../img/labware/deckmap/tiprack-200ul.png'
import tiprackImgSrcActive from '../../img/labware/deckmap/tiprack-200ul-active.png'
import troughImgSrc from '../../img/labware/deckmap/trough-12row.png'
import troughImgSrcActive from '../../img/labware/deckmap/trough-12row-active.png'
import tubeImgSrc from '../../img/labware/deckmap/tube-rack-2ml.png'
import tubeImgSrcActive from '../../img/labware/deckmap/tube-rack-2ml-active.png'

const {
  UNCONFIRMED,
  MOVING_TO_SLOT,
  PICKING_UP,
  HOMING,
  CONFIRMING,
  CONFIRMED
} = robotConstants

LabwareItem.propTypes = {
  slot: PropTypes.number.isRequired,
  type: PropTypes.string,
  isCurrent: PropTypes.bool,
  isDisabled: PropTypes.bool,
  calibration: robotConstants.LABWARE_CONFIRMATION_TYPE
}

export default function LabwareItem (props) {
  const {
    type,
    slot,
    labwareReviewed,
    isCurrent,
    isDisabled,
    moveToLabware,
    calibration
  } = props

  const isMoving = (
    calibration === MOVING_TO_SLOT ||
    calibration === PICKING_UP ||
    calibration === HOMING ||
    calibration === CONFIRMING
  )
  const isConfirmed = calibration === CONFIRMED
  const isUnconfirmed = calibration === UNCONFIRMED
  const url = `/setup-deck/${slot}`

  // TODO: import background image function
  const containerImageURL = (type, active) => {
    const reroutes = active && labwareReviewed
      ? {
        '96-flat': plateImgSrcActive,
        '96-PCR-flat': plateImgSrcActive,
        '96-deep-well': plateImgSrcActive,
        'trough-12row': troughImgSrcActive,
        'tube-rack-2ml': tubeImgSrcActive,
        'tiprack-200ul': tiprackImgSrcActive
      }
      : {
        '96-flat': plateImgSrc,
        '96-PCR-flat': plateImgSrc,
        '96-deep-well': plateImgSrc,
        'trough-12row': troughImgSrc,
        'tube-rack-2ml': tubeImgSrc,
        'tiprack-200ul': tiprackImgSrc
      }

    return reroutes[type]
  }
  const slotStyle = type
    ? {gridArea: `slot-${slot}`, backgroundImage: `url(${containerImageURL(type, isCurrent)})`}
    : {gridArea: `slot-${slot}`}
  let style
  if (labwareReviewed) {
    style = classnames(styles.slot, {
      [styles.active]: isCurrent && !isMoving,
      [styles.disabled]: isDisabled,
      [styles.confirmed]: isConfirmed && !isCurrent
    })
  } else {
    style = styles.slot
  }

  if (!type) {
    return (
      <div style={slotStyle} className={styles.empty_slot}>{slot}</div>
    )
  }
  const labwareLabel = !labwareReviewed && (
    <div className={styles.label}>{type}</div>
  )
  const confirmationMsg = labwareReviewed && isUnconfirmed && (
    <div className={styles.status}>Position Unconfirmed</div>
  )
  const movingNotification = isMoving && isCurrent && (
    <div className={styles.moving}>
      <Spinner className={styles.spinner} />
    </div>
  )
  const confirmationFade = isConfirmed && isCurrent && labwareReviewed && (
    <div className={styles.confirmed_fade}>Confirmed</div>
  )

  if (labwareReviewed) {
    return (
      <NavLink
        to={url}
        style={slotStyle}
        className={style}
        activeClassName={styles.active}
        onClick={moveToLabware}
      >
        {confirmationMsg}
        {movingNotification}
        {confirmationFade}
      </NavLink>
    )
  }
  return (
    <div style={slotStyle} className={style}>
      {labwareLabel}
    </div>
  )
}
