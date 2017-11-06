import {connect} from 'react-redux'

import TipProbe from '../components/TipProbe'

import {
  actions as robotActions
} from '../robot'

const mapStateToProps = (state, ownProps) => ({
  instrument: ownProps.instrument
})

const mapDispatchToProps = (dispatch, ownProps) => {
  const {instrument: {axis}} = ownProps

  return {
    onPrepareClick: () => dispatch(robotActions.moveToFront(axis)),
    onProbeTipClick: () => dispatch(robotActions.probeTip(axis)),
    onCancelClick: () => dispatch(robotActions.resetTipProbe(axis))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(TipProbe)
