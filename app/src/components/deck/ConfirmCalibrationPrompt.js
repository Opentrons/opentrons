import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import {constants as robotConstants} from '../../robot'

import ToolTip, {TOP} from '../ToolTip'
import Diagram from '../Diagram'
import ConfirmCalibrationButtons from './ConfirmCalibrationButtons'
import NextLabwareLink from './NextLabwareLink'
import styles from './deck.css'
import tooltipStyles from '../ToolTip.css'

ConfirmCalibrationPrompt.propTypes = {
  slot: PropTypes.string.isRequired,
  currentLabware: PropTypes.shape({
    slot: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    isTiprack: PropTypes.bool,
    calibration: robotConstants.LABWARE_CONFIRMATION_TYPE
  }).isRequired
}

const {MOVING_TO_SLOT, PICKING_UP, HOMING, UPDATING, CONFIRMED} = robotConstants

export default function ConfirmCalibrationPrompt (props) {
  const {currentLabware, slot} = props
  const {calibration, isTiprack, type} = currentLabware
  const toolTipMessage = <Diagram isTiprack={isTiprack} type={type} />

  // TODO(mc, 2017-11-27): spinner?
  if (
    !calibration ||
    calibration === MOVING_TO_SLOT ||
    calibration === PICKING_UP ||
    calibration === HOMING ||
    calibration === UPDATING
  ) return null

  if (calibration === CONFIRMED) {
    return (
      <div className={styles.prompt}>
        <NextLabwareLink />
      </div>
    )
  }

  return (
    <div className={styles.prompt}>
      <OverSlotCalibrationMessage
        isTiprack={isTiprack}
        slot={slot}
        toolTipMessage={toolTipMessage}
      />
      <ConfirmCalibrationButtons slot={slot} />
    </div>
  )
}

const overSlotStatusStyle = classnames(
  styles.centered_prompt,
  tooltipStyles.parent
)

function OverSlotCalibrationMessage (props) {
  const {isTiprack, slot, toolTipMessage} = props
  const question = isTiprack
    ? 'Did pipette '
    : 'Is pipette '
  const status = isTiprack
    ? 'pick up tip'
    : 'accurately centered'
  const location = isTiprack
    ? ` A1 from tiprack in slot ${slot}?`
    : ` over well A1 of slot ${slot}?`

  return (
    <h3>
      <strong>{question}</strong>
      <span className={overSlotStatusStyle}>
        {status}
        <ToolTip style={TOP}>{toolTipMessage}</ToolTip>
      </span>
      {location}
    </h3>
  )
}
