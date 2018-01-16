// Confirm Labware Calibration Container
import {connect} from 'react-redux'
import React from 'react'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../../robot'

import CalibrationButton from './CalibrationButton'
import CalibrationLink from './CalibrationLink'

export default connect(
  mapStateToProps,
  null,
  mergeProps
)(ConfirmCalibrationButtons)

function ConfirmCalibrationButtons (props) {
  const {slot, onYesClick, onNoClick} = props
  const jogUrl = `/setup-deck/${slot}/jog`

  return (
    <div>
      <CalibrationButton onClick={onYesClick}>
        Yes
      </CalibrationButton>
      <CalibrationLink to={jogUrl} onClick={onNoClick}>
        No
      </CalibrationLink>
    </div>
  )
}

function mapStateToProps (state, ownProps) {
  const {slot} = ownProps
  const isTiprack = robotSelectors.getLabwareBySlot(state)[slot].isTiprack
  const props = {isTiprack}

  // confirm tiprack action needs the instrument being used for confirmation
  // for now, hardcode this to the single-channel
  if (isTiprack) {
    props._calibrator = robotSelectors.getCalibratorMount(state)
  }

  return props
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  const {isTiprack, _calibrator} = stateProps
  const {dispatch} = dispatchProps
  const {slot} = ownProps

  const props = {
    slot,
    onYesClick: isTiprack
      ? () => dispatch(robotActions.confirmTiprack(_calibrator, slot))
      : () => dispatch(robotActions.confirmLabware(slot))
  }

  if (isTiprack) {
    props.onNoClick = () => {
      dispatch(robotActions.dropTipAndHome(_calibrator, slot))
    }
  }

  return props
}
