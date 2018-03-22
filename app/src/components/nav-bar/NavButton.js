// @flow
// nav button container
import * as React from 'react'
import {connect} from 'react-redux'
import {withRouter} from 'react-router'

import type {State} from '../../types'

import {
  selectors as robotSelectors,
  constants as robotConstants
} from '../../robot'
import {getAnyRobotUpdateAvailable} from '../../http-api-client'

import type {IconName} from '@opentrons/components'
import {NavButton, FILE, CALIBRATE, CONNECT, RUN, MORE} from '@opentrons/components'

type OwnProps = {
  name: string
}

type StateProps = {
  iconName: IconName,
  title?: string,
  url?: string
}

export default withRouter(connect(mapStateToProps)(NavButton))

function mapStateToProps (state: State, ownProps: OwnProps): StateProps {
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
  const robotNotification = getAnyRobotUpdateAvailable(state)

  // TODO(mc, 2018-03-08): move this logic to the Calibrate page
  let calibrateUrl
  if (isSessionLoaded) {
    calibrateUrl = '/calibrate/instruments'

    if (!isTipsProbed && nextInstrument) {
      calibrateUrl = `/calibrate/instruments/${nextInstrument.mount}`
    } else if (nextLabware) {
      calibrateUrl = `/calibrate/labware/${nextLabware.slot}`
    } else if (labware[0]) {
      calibrateUrl = `/calibrate/labware/${labware[0].slot}`
    }
  }

  const NAV_ITEM_BY_NAME: {[string]: React.ElementProps<typeof NavButton>} = {
    connect: {
      iconName: CONNECT,
      title: 'robot',
      url: '/robots',
      notification: robotNotification
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
