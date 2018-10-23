// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import find from 'lodash/find'

import {
  NO_SECURITY,
  WPA_EAP_SECURITY,
  fetchWifiList,
  fetchWifiEapOptions,
  configureWifi,
  makeGetRobotWifiList,
  makeGetRobotWifiEapOptions,
  makeGetRobotWifiConfigure,
} from '../../../http-api-client'

import {IntervalWrapper, SpinnerModal} from '@opentrons/components'
import {Portal} from '../../portal'
import {NetworkDropdown} from '../connection'
import ConnectModal from './ConnectModal'
import ConnectForm from './ConnectForm'

import type {State, Dispatch} from '../../../types'
import type {ViewableRobot} from '../../../discovery'
import type {
  WifiNetwork,
  WifiNetworkList,
  WifiSecurityType,
  WifiEapOption,
  WifiConfigureRequest,
} from '../../../http-api-client'

type OP = {robot: ViewableRobot}

type SP = {|
  list: ?WifiNetworkList,
  connectingTo: ?string,
  eapOptions: ?Array<WifiEapOption>,
|}

type DP = {|
  fetchList: () => mixed,
  fetchEapOptions: () => mixed,
  configure: WifiConfigureRequest => mixed,
|}

type Props = {...$Exact<OP>, ...SP, ...DP}

type SelectNetworkState = {
  ssid: ?string,
  securityType: ?WifiSecurityType,
}

const LIST_REFRESH_MS = 15000

class SelectNetwork extends React.Component<Props, SelectNetworkState> {
  constructor (props) {
    super(props)
    // prepopulate selected SSID with currently connected network, if any
    this.state = {ssid: this.getActiveSsid(), securityType: null}
  }

  onChange = (network: WifiNetwork) => {
    const nextState: $Shape<SelectNetworkState> = {
      ssid: network.ssid,
      securityType: network.securityType,
    }

    // TODO(mc, 2018-10-22): pass network security type direct
    if (network.securityType === NO_SECURITY) {
      this.props.configure({ssid: network.ssid})
    } else if (network.securityType === WPA_EAP_SECURITY) {
      this.props.fetchEapOptions()
    }
    // TODO(mc, 2018-10-18): handle hidden network

    this.setState(nextState)
  }

  closeConnectForm = () => this.setState({securityType: null})

  getActiveSsid (): ?string {
    const activeNetwork = find(this.props.list, 'active')
    return activeNetwork && activeNetwork.ssid
  }

  componentDidUpdate (prevProps) {
    // if we don't have a selected network in component state and the list has
    // updated, seed component state with active ssid from props
    if (!this.state.ssid && this.props.list !== prevProps.list) {
      this.setState({ssid: this.getActiveSsid()})
    }
  }

  render () {
    const {list, connectingTo, eapOptions, fetchList, configure} = this.props
    const {ssid, securityType} = this.state

    return (
      <IntervalWrapper refresh={fetchList} interval={LIST_REFRESH_MS}>
        <NetworkDropdown
          list={list}
          value={ssid}
          disabled={connectingTo != null}
          onChange={this.onChange}
        />
        <Portal>
          {connectingTo && (
            <SpinnerModal
              message={`Attempting to connect to network ${connectingTo}`}
              alertOverlay
            />
          )}
          {ssid &&
            securityType &&
            securityType !== NO_SECURITY && (
              <ConnectModal
                ssid={ssid}
                securityType={securityType}
                close={this.closeConnectForm}
              >
                <ConnectForm
                  ssid={ssid}
                  configure={configure}
                  close={this.closeConnectForm}
                  eapOptions={eapOptions}
                  securityType={securityType}
                />
              </ConnectModal>
            )}
        </Portal>
      </IntervalWrapper>
    )
  }
}

function makeMapStateToProps (): (State, OP) => SP {
  const getListCall = makeGetRobotWifiList()
  const getEapCall = makeGetRobotWifiEapOptions()
  const getConfigureCall = makeGetRobotWifiConfigure()

  return (state, ownProps) => {
    const {robot} = ownProps
    const {response: listResponse} = getListCall(state, robot)
    const {response: eapResponse} = getEapCall(state, robot)
    const {
      request: cfgRequest,
      inProgress: cfgInProgress,
      error: cfgError,
    } = getConfigureCall(state, robot)

    return {
      list: listResponse && listResponse.list,
      eapOptions: eapResponse && eapResponse.options,
      connectingTo:
        !cfgError && cfgInProgress && cfgRequest ? cfgRequest.ssid : null,
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {robot} = ownProps

  return {
    fetchList: () => dispatch(fetchWifiList(robot)),
    fetchEapOptions: () => dispatch(fetchWifiEapOptions(robot)),
    configure: params => dispatch(configureWifi(robot, params)),
  }
}

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(SelectNetwork)
