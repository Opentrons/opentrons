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
import {getShellUpdate} from '../../shell'

import type {IconName} from '@opentrons/components'
import {NavButton} from '@opentrons/components'

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
  const isDone = robotSelectors.getIsDone(state)
  const isConnected = (
    robotSelectors.getConnectionStatus(state) === robotConstants.CONNECTED
  )
  const connectedRobotName = robotSelectors.getConnectedRobotName(state)
  const robotNotification = getAnyRobotUpdateAvailable(state)
  const moreNotification = getShellUpdate(state).available != null

  // TODO(ka 2018-5-11): quick workaround to show connected robot on return to robot setting page
  let robotUrl
  if (connectedRobotName) {
    robotUrl = `/robots/${connectedRobotName}`
  } else {
    robotUrl = '/robots'
  }
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
      iconName: 'ot-connect',
      title: 'robot',
      url: robotUrl,
      notification: robotNotification
    },
    upload: {
      disabled: !isConnected || isRunning,
      iconName: 'ot-file',
      title: 'protocol',
      url: '/upload'
    },
    setup: {
      disabled: !isSessionLoaded || isRunning,
      iconName: 'ot-calibrate',
      title: 'calibrate',
      url: calibrateUrl
    },
    run: {
      disabled: !isTipsProbed && !(isRunning || isDone),
      iconName: 'ot-run',
      title: 'run',
      url: '/run'
    },
    more: {
      iconName: 'dots-horizontal',
      isBottom: true,
      title: 'more',
      url: '/menu/app',
      notification: moreNotification
    }
  }

  return NAV_ITEM_BY_NAME[name]
}
