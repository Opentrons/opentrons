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
    singleChannel: robotSelectors.getSingleChannel(state)
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  const {singleChannel} = stateProps
  const {dispatch} = dispatchProps
  const {slot} = ownProps

  return {
    ...ownProps,
    ...stateProps,
    jog: (axis, direction) => () => {
      dispatch(robotActions.jog(singleChannel.axis, axis, direction))
    },
    updateOffset: () => {
      dispatch(robotActions.updateOffset(singleChannel, slot))
    },
    toggleJogDistance: () => dispatch(robotActions.toggleJogDistance())
  }
}
