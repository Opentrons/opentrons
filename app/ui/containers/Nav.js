// top-level container
import React from 'react'
import {connect} from 'react-redux'

import {
  actions as interfaceActions,
  selectors as interfaceSelectors
} from '../interface'

import {
  actions as robotActions,
  selectors as robotSelectors,
  constants as robotConstants
} from '../robot'

import uploadIconSrc from '../img/icon_file.svg'
import setupIconSrc from '../img/icon_setup.svg'

import SideBar from '../components/SideBar'

const mapStateToProps = (state) => {
  const connectionStatus = robotSelectors.getConnectionStatus(state)
  const isConnected = connectionStatus === robotConstants.CONNECTED
  const sessionIsLoaded = robotSelectors.getSessionIsLoaded(state)
  const isOpen = interfaceSelectors.getIsNavPanelOpen(state)
  const activeTask = interfaceSelectors.getCurrentNavPanelTask(state)

  return {
    // interface
    isNavPanelOpen: isOpen,
    currentNavPanelTask: activeTask,
    navLinks: [
      {
        name: 'upload',
        iconSrc: uploadIconSrc,
        isDisabled: !isConnected,
        isActive: isOpen && activeTask === 'upload',
        msg: 'Upload File'
      },
      {
        name: 'setup',
        iconSrc: setupIconSrc,
        // TODO(mc, 2017-10-11): this needs a selector
        isDisabled: !sessionIsLoaded,
        isActive: isOpen && activeTask === 'setup',
        msg: 'Prep For Run'
      }
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
    toggleNavOpen: () => dispatch(interfaceActions.toggleNavPanel()),
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
