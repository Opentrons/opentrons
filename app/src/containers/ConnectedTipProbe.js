import {connect} from 'react-redux'

import TipProbe from '../components/TipProbe'

import {
  actions as robotActions,
  selectors as robotSelectors
} from '../robot'

const mapStateToProps = (state, ownProps) => {
  const instruments = robotSelectors.getInstruments(state)
  const currentInstrument = instruments.find((inst) => inst.axis === ownProps.mount)
  return {
    currentInstrument
  }
}

const mapDispatchToProps = (dispatch, ownProps) => {
  const mount = ownProps.mount
  return {
    onPrepareClick: () => dispatch(robotActions.moveToFront(mount)),
    onProbeTipClick: () => dispatch(robotActions.probeTip(mount)),
    onCancelClick: () => dispatch(robotActions.resetTipProbe(mount))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(TipProbe)
