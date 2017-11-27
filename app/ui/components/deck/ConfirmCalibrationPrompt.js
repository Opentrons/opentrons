import React from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'

import {constants as robotConstants} from '../../robot'

import ToolTip, {TOP} from '../ToolTip'
import Diagram from '../Diagram'
import CalibrationLink from './CalibrationLink'
import ConfirmCalibrationButton from './ConfirmCalibrationButton'
import NextLabwareLink from './NextLabwareLink'
import styles from './deck.css'
import tooltipStyles from '../ToolTip.css'

ConfirmCalibrationPrompt.propTypes = {
  slot: PropTypes.number.isRequired,
  currentLabware: PropTypes.shape({
    slot: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    isTiprack: PropTypes.bool
  }).isRequired
}

const {MOVING_TO_SLOT, OVER_SLOT} = robotConstants

export default function ConfirmCalibrationPrompt (props) {
  const {currentLabware, slot} = props
  const {calibration, isTiprack, type} = currentLabware
  const toolTipMessage = <Diagram isTiprack={isTiprack} type={type} />

  if (!calibration || calibration === MOVING_TO_SLOT) return null

  if (calibration === OVER_SLOT) {
    return (
      <div className={styles.prompt}>
        <OverSlotCalibrationMessage
          isTiprack={isTiprack}
          slot={slot}
          toolTipMessage={toolTipMessage}
        />
        <ConfirmCalibrationButton slot={slot} />
        <CalibrationLink to={`/setup-deck/${slot}/jog`}>
          No
        </CalibrationLink>
      </div>
    )
  }

  return (
    <div className={styles.prompt}>
      <NextLabwareLink />
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
