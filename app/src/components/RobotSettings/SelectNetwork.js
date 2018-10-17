// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import find from 'lodash/find'

import {
  NO_SECURITY,
  fetchWifiList,
  configureWifi,
  makeGetRobotWifiList,
  makeGetRobotWifiConfigure,
} from '../../http-api-client'
import {NetworkDropdown} from './connection'
import {Portal} from '../portal'
import {IntervalWrapper, SpinnerModal} from '@opentrons/components'

import type {State, Dispatch} from '../../types'
import type {ViewableRobot} from '../../discovery'
import type {WifiNetwork, WifiNetworkList} from '../../http-api-client'

type OP = {robot: ViewableRobot}

type SP = {|list: ?WifiNetworkList, connectingTo: ?string|}

type DP = {|
  getList: () => mixed,
  configure: (network: WifiNetwork) => mixed,
|}

type Props = {...$Exact<OP>, ...SP, ...DP}

type SelectNetworkState = {value: ?string}

const LIST_REFRESH_MS = 15000

class SelectNetwork extends React.Component<Props, SelectNetworkState> {
  constructor (props) {
    super(props)
    // prepopulate selected SSID with currently connected network, if any
    this.state = {value: this.getActiveSsid()}
  }

  onChange = (network: WifiNetwork) => {
    this.setState({value: network.ssid})
    this.props.configure(network)
  }

  getActiveSsid (): ?string {
    const activeNetwork = find(this.props.list, 'active')
    return activeNetwork && activeNetwork.ssid
  }

  componentDidUpdate (prevProps) {
    // if we don't have a selected network in component state and the list has
    // updated, seed component state with active ssid from props
    if (!this.state.value && this.props.list !== prevProps.list) {
      this.setState({value: this.getActiveSsid()})
    }
  }

  render () {
    const {list, connectingTo, getList} = this.props
    const {value} = this.state

    return (
      <IntervalWrapper refresh={getList} interval={LIST_REFRESH_MS}>
        <NetworkDropdown
          list={list}
          value={value}
          disabled={connectingTo != null}
          onChange={this.onChange}
        />
        {connectingTo && (
          <Portal>
            <SpinnerModal
              message={`Attempting to connect to network ${connectingTo}`}
            />
          </Portal>
        )}
      </IntervalWrapper>
    )
  }
}

function makeSTP (): (State, OP) => SP {
  const getWifiListCall = makeGetRobotWifiList()
  const getWifiConfigureCall = makeGetRobotWifiConfigure()

  return (state, ownProps) => {
    const {robot} = ownProps
    const {response: listResponse} = getWifiListCall(state, robot)
    const {
      request: cfgRequest,
      inProgress: cfgInProgress,
    } = getWifiConfigureCall(state, robot)

    return {
      connectingTo: cfgInProgress && cfgRequest ? cfgRequest.ssid : null,
      list: listResponse && listResponse.list,
    }
  }
}

function DTP (dispatch: Dispatch, ownProps: OP): DP {
  const {robot} = ownProps

  return {
    getList: () => dispatch(fetchWifiList(robot)),
    configure: network => {
      if (network.securityType === NO_SECURITY) {
        return dispatch(configureWifi(robot, {ssid: network.ssid}))
      }
    },
  }
}

export default connect(
  makeSTP,
  DTP
)(SelectNetwork)
