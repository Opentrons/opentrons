import React from 'react'
import {connect} from 'react-redux'

import {
  actions as robotActions,
  selectors as robotSelectors
} from '../robot'

import PipetteConfig from '../components/PipetteConfig'

const mapStateToProps = (state) => ({
  instruments: robotSelectors.getInstruments(state),
  currentInstrument: robotSelectors.getCurrentInstrument(state)
})

const mapDispatchToProps = (dispatch) => ({
  // TODO(mc, 2017-10-05): pass axis in via props to ease GC pressure
  onPrepareClick: (axis) => () => dispatch(robotActions.moveToFront(axis))
})

function ConnectedPipetteConfig (props) {
  return (
    <PipetteConfig {...props} />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedPipetteConfig)
