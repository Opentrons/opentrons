import React from 'react'
import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../robot'
import SetupPanel from '../components/SetupPanel'

const mapStateToProps = (state) => ({
  instrumentsAreCalibrated: robotSelectors.getInstrumentsAreCalibrated(state),
  isTipracksConfirmed: false, // all tipracks confirmed ? unlock other labware
  isLabwareConfirmed: false, // all labware confirmed ? show run button

  instruments: robotSelectors.getInstruments(state),
  labware: robotSelectors.getLabware(state)
})

const mapDispatchToProps = (dispatch) => ({
  setInstrument: (axis) => () => dispatch(robotActions.setCurrentInstrument(axis)),
  setLabware: (slot) => () => dispatch(robotActions.setCurrentLabware(slot))
})

function ConnectedSetupPanel (props) {
  return (
    <SetupPanel {...props} />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedSetupPanel)
