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

import {NavButton, FILE, CALIBRATE, CONNECT, RUN, MORE} from '@opentrons/components'

export default connect(mapStateToProps, null, mergeProps)(NavButton)

function mapStateToProps (state, ownProps) {
  const {name} = ownProps
  const currentPanel = interfaceSelectors.getCurrentPanel(state)
  const isSessionLoaded = robotSelectors.getSessionIsLoaded(state)
  const nextInstrument = robotSelectors.getNextInstrument(state)
  const labware = robotSelectors.getNotTipracks(state)
  const nextLabware = robotSelectors.getNextLabware(state)
  const isTipsProbed = robotSelectors.getInstrumentsCalibrated(state)
  const isConnected = (
    robotSelectors.getConnectionStatus(state) === robotConstants.CONNECTED
  )
  let calibrateUrl
  if (isSessionLoaded & isTipsProbed) {
    calibrateUrl = nextLabware
     ? `setup-deck/${nextLabware.slot}`
     : `setup-deck/${labware[0].slot}`
  } else if (isSessionLoaded) {
    calibrateUrl = `setup-instruments/${nextInstrument.mount}`
  } else {
    calibrateUrl = '#'
  }

  const NAV_ITEM_BY_NAME = {
    connect: {
      iconName: CONNECT,
      title: 'robot',
      url: '/robots'
    },
    upload: {
      disabled: !isConnected,
      iconName: FILE,
      title: 'protocol',
      url: '/upload'
    },
    setup: {
      disabled: !isSessionLoaded,
      iconName: CALIBRATE,
      title: 'calibrate',
      url: calibrateUrl
    },
    run: {
      disabled: !isTipsProbed,
      iconName: RUN,
      title: 'run',
      url: '/run'
    },
    more: {
      iconName: MORE,
      isBottom: true,
      title: 'more',
      url: '/menu/app'
    }
  }

  const navIcon = NAV_ITEM_BY_NAME[name]

  return {
    ...navIcon,
    isCurrent: name === currentPanel
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
