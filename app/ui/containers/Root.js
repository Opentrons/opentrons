// top-level container
import React from 'react'
import {connect} from 'react-redux'

import {
  NAME as ROBOT_NAME,
  actions as robotActions,
  selectors as robotSelectors
} from '../robot'

import App from '../components/app'

const mapStateToProps = (state) => {
  return {
    isRunning: state.robot.isRunning,
    isConnected: state.robot.isConnected,
    connectionStatus: robotSelectors.getConnectionStatus(state[ROBOT_NAME]),

    // TODO(mc): remove development hardcoded values
    isPaused: false,
    errors: [],
    runCommands: [
      {
        timestamp: '2:01:43 PM',
        command_description: 'Picking up tip from <Deck><Slot E3><Container p10tiprack><Well A1>'
      },
      {
        timestamp: '2:01:56 PM',
        command_description: 'Aspirating 5 at <Deck><Slot D3><Container template><Well A1>'
      },
      {
        timestamp: '2:02:43 PM',
        command_description: 'Picking up tip from <Deck><Slot E3><Container p10tiprack><Well A1>'
      }
    ]
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    onRunButtonClick: () => dispatch(robotActions.run())
  }
}

function Root (props) {
  return (
    <App {...props} />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(Root)
