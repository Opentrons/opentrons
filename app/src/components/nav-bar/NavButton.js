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

import {NavButton, FILE, COG, CONNECT, USB} from '@opentrons/components'

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
    iconName = isConnected
      ? USB
      : CONNECT
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
