import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import {Spinner} from './icons'
import styles from './Labware.css'

import plateImgSrc from '../img/labware/deckmap/96-PCR-flat.png'
import plateImgSrcActive from '../img/labware/deckmap/96-PCR-flat-active.png'
import tiprackImgSrc from '../img/labware/deckmap/tiprack-200ul.png'
import tiprackImgSrcActive from '../img/labware/deckmap/tiprack-200ul-active.png'
import troughImgSrc from '../img/labware/deckmap/trough-12row.png'
import troughImgSrcActive from '../img/labware/deckmap/trough-12row-active.png'
import tubeImgSrc from '../img/labware/deckmap/tube-rack-2ml.png'
import tubeImgSrcActive from '../img/labware/deckmap/tube-rack-2ml-active.png'

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

  // TODO: this is a workaround for user testing with labware images for Bradford
  // will be generated SVGs
  const containerImageURL = (type, active) => {
    const reroutes = active
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
