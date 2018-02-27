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

import {NavButton, FILE, CALIBRATE, CONNECT, MORE} from '@opentrons/components'

export default connect(mapStateToProps, null, mergeProps)(NavButton)

function mapStateToProps (state, ownProps) {
  const {name} = ownProps
  const isPanelClosed = interfaceSelectors.getIsPanelClosed(state)
  const currentPanel = interfaceSelectors.getCurrentPanel(state)
  const isSessionLoaded = robotSelectors.getSessionIsLoaded(state)
  const isConnected = (
    robotSelectors.getConnectionStatus(state) === robotConstants.CONNECTED
  )

  let disabled = false
  let iconName, isBottom, title

  if (name === 'upload') {
    disabled = !isConnected
    iconName = FILE
    title = 'protocol'
  } else if (name === 'setup') {
    disabled = !isSessionLoaded
    iconName = CALIBRATE
    title = 'calibrate'
  } else if (name === 'connect') {
    iconName = CONNECT
    title = 'robot'
  } else if (name === 'more') {
    iconName = MORE
    isBottom = true
    title = 'more'
  }

  return {
    iconName,
    isBottom,
    disabled,
    title,
    isCurrent: !isPanelClosed && name === currentPanel
  }
}

function mergeProps (stateProps, dispatchProps, ownProps) {
  const {dispatch} = dispatchProps
  const {name} = ownProps
  /* TODO (ka 2018-2-8): leaving this commented out in the event we need to
  bring back the collapsible panel.
  const clickAction = isCurrent
    ? interfaceActions.closePanel()
    : interfaceActions.setCurrentPanel(name) */

  return {
    ...ownProps,
    ...stateProps,
    onClick: () => dispatch(interfaceActions.setCurrentPanel(name))
  }
}
