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

import uploadIconSrc from '../img/icon_file.svg'
import setupIconSrc from '../img/icon_setup.svg'

import SideBar from '../components/SideBar'

const mapStateToProps = (state) => {
  const isConnected = state.robot.isConnected
  return {
    // interface
    isNavPanelOpen: interfaceSelectors.getIsNavPanelOpen(state),
    currentNavPanelTask: interfaceSelectors.getCurrentNavPanelTask(state),
    navLinks: [
      {name: 'upload', iconSrc: uploadIconSrc, isDisabled: !isConnected},
      {name: 'setup', iconSrc: setupIconSrc, isDisabled: !isConnected}
    ],

    // robot
    isReadyToRun: robotSelectors.getIsReadyToRun(state),
    isRunning: robotSelectors.getIsRunning(state),
    connectionStatus: robotSelectors.getConnectionStatus(state),
    isConnected
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    // interface
    onNavClick: () => dispatch(interfaceActions.toggleNavPanel()),
    onNavIconClick: (panel) => () => {
      dispatch(interfaceActions.setCurrentNavPanel(panel))
    },

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
