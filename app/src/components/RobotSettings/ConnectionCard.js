// @flow
// RobotSettings card for wifi status
import * as React from 'react'
import {connect} from 'react-redux'
import find from 'lodash/find'

import {makeGetRobotNetworkingStatus} from '../../http-api-client'
import {Card} from '@opentrons/components'
import SelectNetwork from './SelectNetwork'
import {ConnectionStatusMessage, ConnectionInfo} from './connection'

import type {State} from '../../types'
import type {ViewableRobot} from '../../discovery'
import type {InternetStatus, NetworkInterface} from '../../http-api-client'

type OP = {robot: ViewableRobot}

type SP = {|
  internetStatus: ?InternetStatus,
  wifiNetwork: ?NetworkInterface,
  ethernetNetwork: ?NetworkInterface,
|}

type Props = {...$Exact<OP>, ...SP}

export default connect(makeMapStateToProps)(ConnectionCard)

const TITLE = 'Connectivity'
function ConnectionCard (props: Props) {
  const {robot, internetStatus, wifiNetwork, ethernetNetwork} = props

  return (
    <Card title={TITLE}>
      <ConnectionStatusMessage
        type={robot.local ? 'USB' : 'Wi-Fi'}
        status={internetStatus}
      />
      <ConnectionInfo connection={wifiNetwork} title="Wi-Fi">
        <SelectNetwork key={robot.name} robot={robot} />
      </ConnectionInfo>
      <ConnectionInfo connection={ethernetNetwork} title="USB" wired />
    </Card>
  )
}

function makeMapStateToProps (): (State, OP) => SP {
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
    }
  }
}
