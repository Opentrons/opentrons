import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../robot'

import JogModal from '../components/JogModal'

export default connect(mapStateToProps, null, mergeProps)(JogModal)

function mapStateToProps (state) {
  return {
    jogDistance: robotSelectors.getJogDistance(state),
    isJogging: robotSelectors.getJogInProgress(state),
    isUpdating: robotSelectors.getOffsetUpdateInProgress(state),
    _calibrator: robotSelectors.getCalibratorMount(state)
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  const {_calibrator} = stateProps
  const {dispatch} = dispatchProps
  const {slot} = ownProps

  return {
    ...ownProps,
    ...stateProps,
    // TODO(mc, 2017-11-27): make jog button container to remove currying
    jog: (axis, direction) => () => {
      dispatch(robotActions.jog(_calibrator, axis, direction))
    },
    onConfirmClick: () => dispatch(robotActions.updateOffset(_calibrator, slot)),
    toggleJogDistance: () => dispatch(robotActions.toggleJogDistance())
  }
}
