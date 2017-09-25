// top-level container
import React from 'react'
import {connect} from 'react-redux'
import {withRouter} from 'react-router'

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
    currentNavPanelTask: interfaceSelectors.getCurrentNavPanelTask(state),

    // robot
    isConnected: state.robot.isConnected,
    isReadyToRun: robotSelectors.getIsReadyToRun(state),
    isRunning: robotSelectors.getIsRunning(state),
    isPaused: robotSelectors.getIsPaused(state),
    isDone: robotSelectors.getIsDone(state),
    connectionStatus: robotSelectors.getConnectionStatus(state),

    // protocol
    sessionName: robotSelectors.getSessionName(state),
    commands: robotSelectors.getCommands(state),
    startTime: robotSelectors.getStartTime(state),
    runTime: robotSelectors.getRunTime(state),
    runProgress: robotSelectors.getRunProgress(state),

    // TODO(mc): remove development hardcoded values
    errors: []
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    // interface
    onNavClick: () => dispatch(interfaceActions.toggleNavPanel()),
    onNavIconClick: (panel) => () => dispatch(interfaceActions.setCurrentNavPanel(panel)),

    // robot
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Root))
