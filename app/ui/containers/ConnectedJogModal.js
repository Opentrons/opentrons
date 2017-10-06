import React from 'react'
import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  actions as robotActions
} from '../robot'

import JogModal from '../components/JogModal'

const mapStateToProps = (state) => ({
  labware: robotSelectors.getCurrentLabware(state)
})

const mapDispatchToProps = (dispatch) => ({
  jog: (axis, direction) => () => {
    // TODO(mc, 2017-10-06): don't hardcode the pipette and pass slot in via props
    dispatch(robotActions.jog('left', axis, direction))
  },
  updateOffset: (labware) => () => {
    dispatch(robotActions.updateOffset('left', labware))
  }
})

function ConnectedJogModal (props) {
  return (
    <JogModal {...props} />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedJogModal)
