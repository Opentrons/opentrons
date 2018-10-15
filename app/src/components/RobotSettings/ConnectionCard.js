// @flow
// RobotSettings card for wifi status
import * as React from 'react'
import {connect} from 'react-redux'
import {getIn} from '@thi.ng/paths'
import find from 'lodash/find'

import {getConfig} from '../../config'

import type {State} from '../../types'
// import type {State, Dispatch} from '../../types'
import type {ViewableRobot} from '../../discovery'
import {makeGetRobotNetworkingStatus} from '../../http-api-client'

import {RefreshCard} from '@opentrons/components'
import {
  ConnectionStatusMessage,
  ConnectionInfo,
  AvailableNetworks,
} from './connection'

import type {InternetStatus, NetworkInterface} from '../../http-api-client'

type OP = {robot: ViewableRobot}

type SP = {|
  __featureEnabled: boolean,
  internetStatus: ?InternetStatus,
  wifiNetwork: ?NetworkInterface,
  ethernetNetwork: ?NetworkInterface,
|}

// type DP = {||}

type Props = {...$Exact<OP>, ...SP}
// type Props = {...$Exact<OP>, ...SP, ...DP}

const __FEATURE_FLAG = 'devInternal.manageRobotConnection.newCard'

export default connect(
  makeMapStateToProps
  /* mapDispatchToProps */
)(ConnectionCard)

const TITLE = 'Connectivity'
function ConnectionCard (props: Props) {
  // TODO(mc, 2018-10-15): remove feature flag
  if (!props.__featureEnabled) return null

  const {robot, internetStatus, wifiNetwork, ethernetNetwork} = props

  // TODO(mc, 2018-10-15): implement
  return (
    <RefreshCard title={TITLE} refresh={() => console.log('placeholder')}>
      <ConnectionStatusMessage
        type={robot.local ? 'USB' : 'Wi-Fi'}
        status={internetStatus}
      />
      <ConnectionInfo connection={wifiNetwork} title="Wi-Fi">
        <AvailableNetworks />
      </ConnectionInfo>
      <ConnectionInfo connection={ethernetNetwork} title="USB" wired />
    </RefreshCard>
  )
}

function makeMapStateToProps (): (State, OP) => SP {
  const getNetworkingStatusCall = makeGetRobotNetworkingStatus()

  return (state, ownProps) => {
    const {response} = getNetworkingStatusCall(state, ownProps.robot)
    const internetStatus = response && response.status
    const interfaces = response && response.interfaces

    return {
      internetStatus,
      wifiNetwork: find(interfaces, {type: 'wifi'}),
      ethernetNetwork: find(interfaces, {type: 'ethernet'}),
      __featureEnabled: !!getIn(getConfig(state), __FEATURE_FLAG),
    }
  }
}

// function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
//   return {}
// }
