import React from 'react'
import {connect} from 'react-redux'

import TipProbe from '../components/TipProbe'

import {
  actions as robotActions,
  selectors as robotSelectors
} from '../robot'

const mapStateToProps = (state, props) => ({
  currentInstrument: robotSelectors.getCurrentInstrument(state),
  currentCalibration: robotSelectors.getCurrentInstrumentCalibration(state)
})

const mapDispatchToProps = (dispatch, props) => ({
  onProbeTipClick: (axis) => () => dispatch(robotActions.probeTip(axis))
})

function ConnectedTipProbe (props) {
  return (
    <TipProbe {...props} />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedTipProbe)
