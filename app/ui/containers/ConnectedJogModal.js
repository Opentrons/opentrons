import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../robot'

import JogModal from '../components/JogModal'

const mapStateToProps = (state) => ({
  isJogging: robotSelectors.getJogInProgress(state),
  isUpdating: robotSelectors.getOffsetUpdateInProgress(state),
  singleChannel: robotSelectors.getSingleChannel(state)
})

const mapDispatchToProps = (dispatch, ownProps) => {
  const {slot} = ownProps
  return {
    // TODO(mc, 2017-10-06): make jog buttons containers so we can get rid
    // of this supercurried function
    jog: (instrument) => (axis, direction) => () => {
      dispatch(robotActions.jog(instrument, axis, direction))
    },
    updateOffset: (instrument) => () => {
      dispatch(robotActions.updateOffset(instrument, slot))
    }
  }
}

// TODO(mc, 2017-11-03): investigate whether or not we can just get access to
// dispatch and/or state in here. I think we're overcomplicating things
const mergeProps = (stateProps, dispatchProps) => {
  const props = {...stateProps, ...dispatchProps}
  const {singleChannel, jog, updateOffset} = props

  props.jog = jog(singleChannel.axis)
  props.updateOffset = updateOffset(singleChannel.axis)

  return props
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(JogModal)
