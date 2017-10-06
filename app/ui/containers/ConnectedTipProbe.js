import React from 'react'
import {connect} from 'react-redux'

import TipProbe from '../components/TipProbe'

import {
  actions as robotActions,
  selectors as robotSelectors
} from '../robot'

const mapStateToProps = (state, props) => ({
  instrument: props.instrument,
  currentInstrument: robotSelectors.getCurrentInstrument(state),
  currentCalibration: robotSelectors.getCurrentInstrumentCalibration(state)
})

const mapDispatchToProps = (dispatch, props) => ({
  onPrepareClick: () => dispatch(robotActions.moveToFront(props.instrument.axis)),
  onProbeTipClick: () => dispatch(robotActions.probeTip(props.instrument.axis))
})

function ConnectedTipProbe (props) {
  return (
    <TipProbe {...props} />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedTipProbe)
