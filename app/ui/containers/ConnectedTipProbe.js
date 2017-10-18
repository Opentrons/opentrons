import {connect} from 'react-redux'

import TipProbe from '../components/TipProbe'

import {
  actions as robotActions
} from '../robot'

const mapStateToProps = (state, ownProps) => ({
  instrument: ownProps.instrument
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  onPrepareClick: () => {
    dispatch(robotActions.moveToFront(ownProps.instrument.axis))
  },
  onProbeTipClick: () => {
    dispatch(robotActions.probeTip(ownProps.instrument.axis))
  }
})

export default connect(mapStateToProps, mapDispatchToProps)(TipProbe)
