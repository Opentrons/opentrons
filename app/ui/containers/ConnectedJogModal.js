import React from 'react'
import {connect} from 'react-redux'

import JogModal from '../components/JogModal'

const mapStateToProps = (state) => ({
  currentLabware: {
    slot: 1,
    id: 'A1',
    name: 'tiprack',
    type: 'tiprack-200ul',
    isConfirmed: false,
    isTiprack: true
  }
})

const mapDispatchToProps = (dispatch) => ({
  // jog actions...
})

function ConnectedJogModal (props) {
  return (
    <JogModal {...props} />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectedJogModal)
