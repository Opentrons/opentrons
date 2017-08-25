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

import App from '../components/App'

const mapStateToProps = (state) => {
  return {
    // interface
    isNavPanelOpen: interfaceSelectors.getIsNavPanelOpen(state),

    // robot
    isConnected: state.robot.isConnected,
    isReadyToRun: robotSelectors.getIsReadyToRun(state),
    isRunning: state.robot.isRunning,
    isPaused: state.robot.isPaused,
    connectionStatus: robotSelectors.getConnectionStatus(state),

    // protocol
    protocolName: robotSelectors.getProtocolName(state),
    commands: robotSelectors.getCommands(state),
    currentCommand: robotSelectors.getCurrentCommand(state),
    runProgress: robotSelectors.getRunProgress(state),

    // TODO(mc): remove development hardcoded values
    errors: []
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    // interface
    onNavClick: () => dispatch(interfaceActions.toggleNavPanel()),

    // robot
    // TODO(mc): revisit when robot discovery / multiple robots is addressed
    onConnectClick: () => dispatch(robotActions.connect()),
    onRunClick: () => dispatch(robotActions.run()),
    onPauseClick: () => dispatch(robotActions.pause()),
    onResumeClick: () => dispatch(robotActions.resume()),
    onCancelClick: () => dispatch(robotActions.cancel())
  }
}

function Root (props) {
  return (
    <App {...props} />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(Root)
