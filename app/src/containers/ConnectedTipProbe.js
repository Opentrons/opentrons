// @flow
import type {Dispatch} from 'redux'
import {connect} from 'react-redux'

import type {Mount} from '../robot'
import TipProbe from '../components/TipProbe'

import {
  actions as robotActions,
  selectors as robotSelectors
} from '../robot'

type OwnProps = {
  mount: Mount
}

const mapStateToProps = (state, ownProps: OwnProps) => {
  const mount = ownProps.mount
  const instruments = robotSelectors.getInstruments(state)
  const currentInstrument = instruments.find((inst) => inst.mount === mount)

  return {
    currentInstrument
  }
}

const mapDispatchToProps = (dispatch: Dispatch<*>, ownProps: OwnProps) => {
  const mount = ownProps.mount

  return {
    onPrepareClick: () => dispatch(robotActions.moveToFront(mount)),
    onProbeTipClick: () => dispatch(robotActions.probeTip(mount)),
    onCancelClick: () => dispatch(robotActions.resetTipProbe(mount))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(TipProbe)
