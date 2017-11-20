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
        <h3>
          <strong>Is Pipette &nbsp;</strong>
          <span className={classnames(styles.centered_prompt, tooltipStyles.parent)}>
            accurately centered
            <ToolTip style={TOP}>{toolTipMessage}</ToolTip>
          </span>
          &nbsp; over the A1 well of slot {slot}?
        </h3>
        <ConfirmCalibrationButton slot={slot} />
        <CalibrationLink to={`/setup-deck/${slot}/jog`}>No</CalibrationLink>
      </div>
    )
  }
  return (
    <div className={styles.prompt}>
      <NextLabwareLink />
    </div>
  )
}
