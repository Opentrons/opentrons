// Confirm Labware Calibration Container
import {connect} from 'react-redux'
import React from 'react'

import {
  actions as robotActions
} from '../../robot'

import CalibrationButton from './CalibrationButton'

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {slot} = ownProps
  const {dispatch} = dispatchProps
  return {
    onButtonClick: () => dispatch(robotActions.confirmLabware(slot))
  }
}

export default connect(null, null, mergeProps)(ConfirmCalibrationButton)

function ConfirmCalibrationButton (props) {
  return (<CalibrationButton {...props}>Yes</CalibrationButton>)
}
