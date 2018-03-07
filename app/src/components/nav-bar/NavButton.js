// nav button container
import {connect} from 'react-redux'
import {withRouter} from 'react-router'

import {
  selectors as robotSelectors,
  constants as robotConstants
} from '../../robot'

import {NavButton, FILE, CALIBRATE, CONNECT, RUN, MORE} from '@opentrons/components'

export default withRouter(connect(mapStateToProps)(NavButton))

function mapStateToProps (state, ownProps) {
  const {name} = ownProps
  const isSessionLoaded = robotSelectors.getSessionIsLoaded(state)
  const nextInstrument = robotSelectors.getNextInstrument(state)
  const labware = robotSelectors.getNotTipracks(state)
  const nextLabware = robotSelectors.getNextLabware(state)
  const isTipsProbed = robotSelectors.getInstrumentsCalibrated(state)
  const isRunning = robotSelectors.getIsRunning(state)
  const isConnected = (
    robotSelectors.getConnectionStatus(state) === robotConstants.CONNECTED
  )
  let calibrateUrl
  if (isSessionLoaded & isTipsProbed) {
    calibrateUrl = nextLabware
     ? `/calibrate/labware/${nextLabware.slot}`
     : `/calibrate/labware/${labware[0].slot}`
  } else if (isSessionLoaded) {
    calibrateUrl = `/calibrate/instruments/${nextInstrument.mount}`
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
      disabled: !isConnected || isRunning,
      iconName: FILE,
      title: 'protocol',
      url: '/upload'
    },
    setup: {
      disabled: !isSessionLoaded || isRunning,
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

  return NAV_ITEM_BY_NAME[name]
}
