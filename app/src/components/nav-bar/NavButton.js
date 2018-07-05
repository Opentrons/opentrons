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
      notification: robotNotification
    },
    upload: {
      disabled: !isConnected || isProtocolRunning,
      iconName: 'ot-file',
      title: 'protocol',
      url: '/upload'
    },
    setup: {
      disabled: !isProtocolLoaded || isProtocolRunning || isProtocolDone,
      iconName: 'ot-calibrate',
      title: 'calibrate',
      url: '/calibrate'
    },
    run: {
      disabled: !isProtocolLoaded,
      iconName: 'ot-run',
      title: 'run',
      url: '/run'
    },
    more: {
      iconName: 'dots-horizontal',
      isBottom: true,
      title: 'more',
      url: '/menu',
      notification: moreNotification
    }
  }

  return NAV_ITEM_BY_NAME[name]
}
