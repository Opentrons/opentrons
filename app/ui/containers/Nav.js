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

import SideBar from '../components/SideBar'

const mapStateToProps = (state) => {
  return {
    // interface
    isNavPanelOpen: interfaceSelectors.getIsNavPanelOpen(state),
    currentNavPanelTask: interfaceSelectors.getCurrentNavPanelTask(state),

    // robot
    isConnected: state.robot.isConnected,
    isReadyToRun: robotSelectors.getIsReadyToRun(state),
    isRunning: robotSelectors.getIsRunning(state),
    connectionStatus: robotSelectors.getConnectionStatus(state)
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    // interface
    onNavClick: () => dispatch(interfaceActions.toggleNavPanel()),
    onNavIconClick: (panel) => () => dispatch(interfaceActions.setCurrentNavPanel(panel)),

    // robot
    // TODO(mc): revisit when robot discovery / multiple robots is addressed
    onConnectClick: () => dispatch(robotActions.connect()),
    onDisconnectClick: () => dispatch(robotActions.disconnect()),
    onRunClick: () => dispatch(robotActions.run()),

    // session
    onUpload: (event) => dispatch(robotActions.session(event.target.files[0]))
  }
}

function Nav (props) {
  return (
    <SideBar {...props} />
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(Nav)
