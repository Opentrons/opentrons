// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import find from 'lodash/find'

import {
  NO_SECURITY,
  configureWifi,
  makeGetRobotWifiList,
} from '../../http-api-client'
import {AvailableNetworks} from './connection'

import type {State, Dispatch} from '../../types'
import type {ViewableRobot} from '../../discovery'
import type {WifiNetwork, WifiNetworkList} from '../../http-api-client'

type OP = {robot: ViewableRobot}

type SP = {|list: ?WifiNetworkList|}

type DP = {|connect: (network: WifiNetwork) => mixed|}

type Props = {...$Exact<OP>, ...SP, ...DP}

type SelectNetworkState = {selected: ?string}

class SelectNetwork extends React.Component<Props, SelectNetworkState> {
  constructor (props) {
    super(props)
    // prepopulate selected SSID with currently connected network, if any
    const connected = find(props.list, 'active')
    this.state = {selected: connected && connected.ssid}
  }

  onChange = (network: WifiNetwork) => {
    this.setState({selected: network.ssid})
    this.props.connect(network)
  }

  render () {
    const {list} = this.props
    const {selected} = this.state

    return (
      <AvailableNetworks
        list={list}
        selected={selected}
        onChange={this.onChange}
      />
    )
  }
}

function makeSTP (): (State, OP) => SP {
  const getWifiListCall = makeGetRobotWifiList()

  return (state, ownProps) => {
    const {response: listResponse} = getWifiListCall(state, ownProps.robot)

    return {list: listResponse && listResponse.list}
  }
}

function DTP (dispatch: Dispatch, ownProps: OP): DP {
  return {
    connect: network => {
      if (network.securityType === NO_SECURITY) {
        return dispatch(configureWifi(ownProps.robot, {ssid: network.ssid}))
      }
    },
  }
}

export default connect(
  makeSTP,
  DTP
)(SelectNetwork)
