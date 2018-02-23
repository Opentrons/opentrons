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

import {NavButton, FILE, COG, CONNECT, MORE} from '@opentrons/components'

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
  let iconName, isBottom

  if (name === 'upload') {
    disabled = !isConnected
    iconName = FILE
  } else if (name === 'setup') {
    disabled = !isSessionLoaded
    iconName = COG
  } else if (name === 'connect') {
    iconName = CONNECT
  } else if (name === 'more') {
    iconName = MORE
    isBottom = true
  }

  return {
    iconName,
    isBottom,
    disabled,
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
