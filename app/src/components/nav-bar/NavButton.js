// @flow
// nav button container
import * as React from 'react'
import {connect} from 'react-redux'
import {withRouter} from 'react-router'

import type {State} from '../../types'
import type {RobotService} from '../../robot'

import {
  selectors as robotSelectors,
  constants as robotConstants,
} from '../../robot'
import {getAnyRobotUpdateAvailable} from '../../http-api-client'
import {getShellUpdate} from '../../shell'

import {NavButton} from '@opentrons/components'

type Props = React.ElementProps<typeof NavButton>

type OP = {
  name: string,
}

type SP = Props & {
  _robot: ?RobotService,
}

export default withRouter(connect(mapStateToProps)(NavButton))

function mapStateToProps (state: State, ownProps: OP): SP {
  const {name} = ownProps
  const _robot = robotSelectors.getConnectedRobot(state)
  const isProtocolLoaded = robotSelectors.getSessionIsLoaded(state)
  const isProtocolRunning = robotSelectors.getIsRunning(state)
  const isProtocolDone = robotSelectors.getIsDone(state)
  const isConnected = (
    robotSelectors.getConnectionStatus(state) === robotConstants.CONNECTED
  )
  const robotNotification = getAnyRobotUpdateAvailable(state)
  const moreNotification = getShellUpdate(state).available != null

  const NAV_ITEM_BY_NAME: {[string]: React.ElementProps<typeof NavButton>} = {
    connect: {
      iconName: 'ot-connect',
      title: 'robot',
      url: '/robots',
      notification: robotNotification,
    },
    upload: {
      disabled: !isConnected || isProtocolRunning,
      iconName: 'ot-file',
      title: 'protocol',
      url: '/upload',
    },
    setup: {
      disabled: !isProtocolLoaded || isProtocolRunning || isProtocolDone,
      iconName: 'ot-calibrate',
      title: 'calibrate',
      url: '/calibrate',
    },
    run: {
      disabled: !isProtocolLoaded,
      iconName: 'ot-run',
      title: 'run',
      url: '/run',
    },
    more: {
      iconName: 'dots-horizontal',
      isBottom: true,
      title: 'more',
      url: '/menu',
      notification: moreNotification,
    },
  }

  return {...NAV_ITEM_BY_NAME[name], _robot}
}
