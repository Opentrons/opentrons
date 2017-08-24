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
    isReadyToRun: robotSelectors.getIsReadyToRun(state),
    isRunning: state.robot.isRunning,
    isConnected: state.robot.isConnected,
    connectionStatus: robotSelectors.getConnectionStatus(state),

    // protocol
    protocolName: robotSelectors.getProtocolName(state),
    commands: robotSelectors.getCommands(state),

    // TODO(mc): remove development hardcoded values
    isPaused: false,
    errors: []
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
