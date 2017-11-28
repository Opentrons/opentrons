import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../robot'

import JogModal from '../components/JogModal'

export default connect(mapStateToProps, null, mergeProps)(JogModal)

function mapStateToProps (state, ownProps) {
  const {slot} = ownProps

  return {
    jogDistance: robotSelectors.getJogDistance(state),
    isJogging: robotSelectors.getJogInProgress(state),
    isUpdating: robotSelectors.getOffsetUpdateInProgress(state),
    singleChannel: robotSelectors.getSingleChannel(state),
    isTiprack: robotSelectors.getLabwareBySlot(state)[slot].isTiprack
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  const {isTiprack, singleChannel: {axis: instrument}} = stateProps
  const {dispatch} = dispatchProps
  const {slot} = ownProps

  return {
    ...ownProps,
    ...stateProps,
    // TODO(mc, 2017-11-27): make jog button container to remove currying
    jog: (axis, direction) => () => {
      dispatch(robotActions.jog(instrument, axis, direction))
    },
    // TODO(mc, 2017-11-27): refactor to remove double-dispatch
    onConfirmClick: () => {
      dispatch(robotActions.updateOffset(instrument, slot))
      if (isTiprack) {
        dispatch(robotActions.pickupAndHome(instrument, slot))
      }
    },
    toggleJogDistance: () => dispatch(robotActions.toggleJogDistance())
  }
}
