// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import find from 'lodash/find'

import {
  NO_SECURITY,
  WPA_PSK_SECURITY,
  fetchWifiList,
  configureWifi,
  makeGetRobotWifiList,
  makeGetRobotWifiConfigure,
} from '../../../http-api-client'

import {IntervalWrapper, SpinnerModal, AlertModal} from '@opentrons/components'
import {Portal} from '../../portal'
import {NetworkDropdown} from '../connection'
import {ConnectForm} from './ConnectForm'

import type {State, Dispatch} from '../../../types'
import type {ViewableRobot} from '../../../discovery'
import type {
  WifiNetwork,
  WifiNetworkList,
  WifiConfigureRequest,
} from '../../../http-api-client'

type OP = {robot: ViewableRobot}

type SP = {|list: ?WifiNetworkList, connectingTo: ?string|}

type DP = {|
  getList: () => mixed,
  configure: WifiConfigureRequest => mixed,
|}

type Props = {...$Exact<OP>, ...SP, ...DP}

type SelectNetworkState = {
  ssid: ?string,
  connectFormType: ?typeof WPA_PSK_SECURITY,
}

const LIST_REFRESH_MS = 15000

class SelectNetwork extends React.Component<Props, SelectNetworkState> {
  constructor (props) {
    super(props)
    // prepopulate selected SSID with currently connected network, if any
    this.state = {ssid: this.getActiveSsid(), connectFormType: null}
  }

  onChange = (network: WifiNetwork) => {
    const nextState: $Shape<SelectNetworkState> = {ssid: network.ssid}

    if (network.securityType === NO_SECURITY) {
      this.props.configure({ssid: network.ssid})
    } else if (network.securityType === WPA_PSK_SECURITY) {
      nextState.connectFormType = WPA_PSK_SECURITY
    }
    // TODO(mc, 2018-10-18): handle WPA_EAP_SECURITY
    // TODO(mc, 2018-10-18): handle hidden network

    this.setState(nextState)
  }

  closeConnectForm = () => this.setState({connectFormType: null})

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
    const {list, connectingTo, getList, configure} = this.props
    const {ssid, connectFormType} = this.state

    return (
      <IntervalWrapper refresh={getList} interval={LIST_REFRESH_MS}>
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
            connectFormType === WPA_PSK_SECURITY && (
              <AlertModal
                heading={`WiFi network ${ssid} requires a WPA2 password`}
                iconName="wifi"
                onCloseClick={this.closeConnectForm}
                alertOverlay
              >
                <ConnectForm
                  ssid={ssid}
                  configure={configure}
                  close={this.closeConnectForm}
                  fields={[
                    {
                      name: 'psk',
                      displayName: 'Password:',
                      type: 'password',
                      required: true,
                    },
                  ]}
                />
              </AlertModal>
            )}
        </Portal>
      </IntervalWrapper>
    )
  }
}

function makeMapStateToProps (): (State, OP) => SP {
  const getWifiListCall = makeGetRobotWifiList()
  const getWifiConfigureCall = makeGetRobotWifiConfigure()

  return (state, ownProps) => {
    const {robot} = ownProps
    const {response: listResponse} = getWifiListCall(state, robot)
    const {
      request: cfgRequest,
      inProgress: cfgInProgress,
      error: cfgError,
    } = getWifiConfigureCall(state, robot)

    return {
      list: listResponse && listResponse.list,
      connectingTo:
        !cfgError && cfgInProgress && cfgRequest ? cfgRequest.ssid : null,
    }
  }
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {robot} = ownProps

  return {
    getList: () => dispatch(fetchWifiList(robot)),
    configure: params => dispatch(configureWifi(robot, params)),
  }
}

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(SelectNetwork)
