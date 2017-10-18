import {connect} from 'react-redux'

import {
  actions as robotActions
} from '../robot'

import JogModal from '../components/JogModal'

const mapStateToProps = (state) => ({})

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
