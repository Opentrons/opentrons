// top-level container
import React from 'react'
import {connect} from 'react-redux'

import {
  actions as interfaceActions,
  selectors as interfaceSelectors
} from '../interface'

import {
  actions as robotActions,
  selectors as robotSelectors
} from '../robot'

import App from '../components/app'

const mapStateToProps = (state) => {
  return {
    // interface
    isNavPanelOpen: interfaceSelectors.getIsNavPanelOpen(state),

    // robot
    isRunning: state.robot.isRunning,
    isConnected: state.robot.isConnected,
    connectionStatus: robotSelectors.getConnectionStatus(state),

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
    // interface
    onNavButtonClick: () => dispatch(interfaceActions.toggleNavPanel()),

    // robot
    onRunButtonClick: () => dispatch(robotActions.run()),
    // TODO(mc): revisit when robot discovery / multiple robots is addressed
    onConnectButtonClick: () => dispatch(robotActions.connect())
  }
}

function Root (props) {
  return (
    <App {...props} />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(Root)
