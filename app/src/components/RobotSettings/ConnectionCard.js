// @flow
// RobotSettings card for wifi status
import * as React from 'react'
import {connect} from 'react-redux'
import {getIn} from '@thi.ng/paths'
import find from 'lodash/find'

import {getConfig} from '../../config'
import {makeGetRobotNetworkingStatus} from '../../http-api-client'
import {RefreshCard} from '@opentrons/components'
import SelectNetwork from './SelectNetwork'
import {ConnectionStatusMessage, ConnectionInfo} from './connection'

import type {State} from '../../types'
import type {ViewableRobot} from '../../discovery'
import type {InternetStatus, NetworkInterface} from '../../http-api-client'

type OP = {robot: ViewableRobot}

type SP = {|
  __featureEnabled: boolean,
  internetStatus: ?InternetStatus,
  wifiNetwork: ?NetworkInterface,
  ethernetNetwork: ?NetworkInterface,
|}

type Props = {...$Exact<OP>, ...SP}

const __FEATURE_FLAG = 'devInternal.manageRobotConnection.newCard'

export default connect(makeSTP)(ConnectionCard)

const TITLE = 'Connectivity'
function ConnectionCard (props: Props) {
  // TODO(mc, 2018-10-15): remove feature flag
  if (!props.__featureEnabled) return null

  const {robot, internetStatus, wifiNetwork, ethernetNetwork} = props

  return (
    <RefreshCard title={TITLE} refresh={() => console.log('placeholder')}>
      <ConnectionStatusMessage
        type={robot.local ? 'USB' : 'Wi-Fi'}
        status={internetStatus}
      />
      <ConnectionInfo connection={wifiNetwork} title="Wi-Fi">
        <SelectNetwork key={robot.name} robot={robot} />
      </ConnectionInfo>
      <ConnectionInfo connection={ethernetNetwork} title="USB" wired />
    </RefreshCard>
  )
}

function makeSTP (): (State, OP) => SP {
  const getNetworkingStatusCall = makeGetRobotNetworkingStatus()

  return (state, ownProps) => {
    const {robot} = ownProps
    const {response: statusResponse} = getNetworkingStatusCall(state, robot)
    const internetStatus = statusResponse && statusResponse.status
    const interfaces = statusResponse && statusResponse.interfaces

    return {
      internetStatus,
      wifiNetwork: find(interfaces, {type: 'wifi'}),
      ethernetNetwork: find(interfaces, {type: 'ethernet'}),
      __featureEnabled: !!getIn(getConfig(state), __FEATURE_FLAG),
    }
  }
}
