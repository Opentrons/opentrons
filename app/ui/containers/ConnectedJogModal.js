import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../robot'

import JogModal from '../components/JogModal'

const mapStateToProps = (state) => ({
  isJogging: robotSelectors.getJogInProgress(state),
  isUpdating: robotSelectors.getOffsetUpdateInProgress(state)
})

const mapDispatchToProps = (dispatch, ownProps) => {
  const {slot} = ownProps

  return {
    jog: (axis, direction) => () => {
      // TODO(mc, 2017-10-06): don't hardcode the pipette
      dispatch(robotActions.jog('left', axis, direction))
    },
    updateOffset: () => dispatch(robotActions.updateOffset('left', slot))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(JogModal)
