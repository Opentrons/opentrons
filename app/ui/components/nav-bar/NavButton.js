// nav button container
import {connect} from 'react-redux'

import {
  actions as interfaceActions,
  selectors as interfaceSelectors
} from '../../interface'

import {
  selectors as robotSelectors,
  constants as robotConstants
} from '../../robot'

import SideBarButton from './SideBarButton'

import uploadIconSrc from '../../img/icon_file.png'
import setupIconSrc from '../../img/icon_setup.svg'
import controlledUSBSrc from '../../img/icon_usb_controlled.png'
import discoverSrc from '../../img/icon_discover.png'

export default connect(mapStateToProps, null, mergeProps)(SideBarButton)

function mapStateToProps (state, ownProps) {
  const {name} = ownProps
  const isPanelOpen = interfaceSelectors.getIsPanelOpen(state)
  const currentPanel = interfaceSelectors.getCurrentPanel(state)
  const isSessionLoaded = robotSelectors.getSessionIsLoaded(state)
  const isConnected = (
    robotSelectors.getConnectionStatus(state) === robotConstants.CONNECTED
  )

  let disabled = false
  let src

  if (name === 'upload') {
    disabled = !isConnected
    src = uploadIconSrc
  } else if (name === 'setup') {
    disabled = !isSessionLoaded
    src = setupIconSrc
  } else if (name === 'connect') {
    src = isConnected
      ? controlledUSBSrc
      : discoverSrc
  }

  return {
    src,
    disabled,
    isCurrent: isPanelOpen && name === currentPanel
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  const {dispatch} = dispatchProps
  const {isCurrent} = stateProps
  const {name} = ownProps
  const clickAction = isCurrent
    ? interfaceActions.closePanel()
    : interfaceActions.setCurrentPanel(name)

  return {
    ...ownProps,
    ...stateProps,
    onClick: () => dispatch(clickAction)
  }
}
