import React from 'react'
import {connect} from 'react-redux'

import TipProbe from '../components/TipProbe'

import {
  actions as robotActions
  // selectors as robotSelectors
} from '../robot'

const mapStateToProps = (state) => ({
  // ?: getCurrentInstrument selector?
  currentInstrument: {
    axis: 'left',
    channels: 'single',
    volume: 200,
    tipIsPreparingForProbe: true,
    tipIsReadyForProbe: false,
    tipIsProbing: false,
    tipIsProbed: false
  }
})

const mapDispatchToProps = (dispatch) => ({
  onInitiateTipProbeClick: () => dispatch(robotActions.intitateTipProbe())
})

function ConnectedTipProbe (props) {
  return (
    <TipProbe {...props} />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedTipProbe)
