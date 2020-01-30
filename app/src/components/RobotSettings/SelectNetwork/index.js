// @flow
import * as React from 'react'
import { connect } from 'react-redux'
import find from 'lodash/find'

import {
  NO_SECURITY,
  WPA_EAP_SECURITY,
  fetchWifiList,
  fetchWifiEapOptions,
  fetchWifiKeys,
  fetchNetworkingStatus,
  addWifiKey,
  configureWifi,
  makeGetRobotWifiList,
  makeGetRobotWifiEapOptions,
  makeGetRobotWifiKeys,
  makeGetRobotWifiConfigure,
  clearConfigureWifiResponse,
} from '../../../http-api-client'

import { startDiscovery } from '../../../discovery'
import { chainActions } from '../../../util'

import { IntervalWrapper, SpinnerModal } from '@opentrons/components'
import { Portal } from '../../portal'
import ConnectModal from './ConnectModal'
import ConnectForm from './ConnectForm'
import { SelectSsid } from './SelectSsid'
import WifiConnectModal from './WifiConnectModal'

import type { State, Dispatch } from '../../../types'
import type { ViewableRobot } from '../../../discovery/types'
import type {
  WifiNetworkList,
  WifiSecurityType,
  WifiEapOptionsList,
  WifiKeysList,
  WifiConfigureRequest,
  WifiConfigureResponse,
  ApiRequestError,
} from '../../../http-api-client'

type OP = {| robot: ViewableRobot |}

type SP = {|
  list: ?WifiNetworkList,
  connectingTo: ?string,
  eapOptions: ?WifiEapOptionsList,
  keys: ?WifiKeysList,
  configRequest: ?WifiConfigureRequest,
  configResponse: ?WifiConfigureResponse,
  configError: ?ApiRequestError,
|}

type DP = {|
  fetchEapOptions: () => mixed,
  fetchKeys: () => mixed,
  addKey: (file: File) => mixed,
  configure: WifiConfigureRequest => mixed,
  refresh: () => mixed,
  clearConfigure: () => mixed,
|}

type Props = { ...OP, ...SP, ...DP }

type SelectNetworkState = {
  ssid: ?string,
  securityType: ?WifiSecurityType,
  modalOpen: boolean,
}

const LIST_REFRESH_MS = 15000

class SelectNetwork extends React.Component<Props, SelectNetworkState> {
  constructor(props: Props) {
    super(props)
    // prepopulate selected SSID with currently connected network, if any
    this.state = {
      ssid: this.getActiveSsid(),
      securityType: null,
      modalOpen: false,
    }
  }

  setCurrentSsid = (_: string, ssid: ?string) => {
    const network = find(this.props.list, { ssid })
    const securityType = network && network.securityType
    const nextState = {
      ssid,
      securityType,
      modalOpen: securityType !== NO_SECURITY,
    }

    if (ssid && !nextState.modalOpen) {
      this.props.configure({ ssid })
    } else if (securityType === WPA_EAP_SECURITY || !securityType) {
      this.props.fetchEapOptions()
      this.props.fetchKeys()
    }

    this.setState(nextState)
  }

  closeConnectForm = () =>
    this.setState({ securityType: null, modalOpen: false })

  getActiveSsid(): ?string {
    const activeNetwork = find(this.props.list, 'active')
    return activeNetwork && activeNetwork.ssid
  }

  render() {
    const {
      list,
      connectingTo,
      eapOptions,
      keys,
      refresh,
      addKey,
      configure,
      configRequest,
      configResponse,
      configError,
      clearConfigure,
    } = this.props
    const { ssid, securityType, modalOpen } = this.state

    return (
      <IntervalWrapper refresh={refresh} interval={LIST_REFRESH_MS}>
        <SelectSsid
          list={list || []}
          disabled={connectingTo != null}
          onValueChange={this.setCurrentSsid}
        />
        <Portal>
          {connectingTo && (
            <SpinnerModal
              message={`Attempting to connect to network ${connectingTo}`}
              alertOverlay
            />
          )}
          {modalOpen && (
            <ConnectModal
              ssid={ssid}
              securityType={securityType}
              close={this.closeConnectForm}
            >
              <ConnectForm
                ssid={ssid}
                securityType={securityType}
                eapOptions={eapOptions}
                keys={keys}
                configure={configure}
                close={this.closeConnectForm}
                addKey={addKey}
              />
            </ConnectModal>
          )}
          {configRequest && !!(configError || configResponse) && (
            <WifiConnectModal
              error={configError}
              request={configRequest}
              response={configResponse}
              close={clearConfigure}
            />
          )}
        </Portal>
      </IntervalWrapper>
    )
  }
}

function makeMapStateToProps(): (State, OP) => SP {
  const getListCall = makeGetRobotWifiList()
  const getEapCall = makeGetRobotWifiEapOptions()
  const getKeysCall = makeGetRobotWifiKeys()
  const getConfigureCall = makeGetRobotWifiConfigure()

  return (state, ownProps) => {
    const { robot } = ownProps
    const { response: listResponse } = getListCall(state, robot)
    const { response: eapResponse } = getEapCall(state, robot)
    const { response: keysResponse } = getKeysCall(state, robot)
    const {
      request: cfgRequest,
      inProgress: cfgInProgress,
      response: cfgResponse,
      error: cfgError,
    } = getConfigureCall(state, robot)

    return {
      list: listResponse && listResponse.list,
      eapOptions: eapResponse && eapResponse.options,
      keys: keysResponse && keysResponse.keys,
      connectingTo:
        !cfgError && cfgInProgress && cfgRequest ? cfgRequest.ssid : null,
      configRequest: cfgRequest,
      configResponse: cfgResponse,
      configError: cfgError,
    }
  }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const { robot } = ownProps
  const refreshActions = [fetchWifiList(robot), fetchNetworkingStatus(robot)]
  const configure = params =>
    dispatch(
      chainActions(
        configureWifi(robot, params),
        startDiscovery(),
        ...refreshActions
      )
    )

  return {
    configure,
    clearConfigure: () => dispatch(clearConfigureWifiResponse(robot)),
    fetchEapOptions: () => dispatch(fetchWifiEapOptions(robot)),
    fetchKeys: () => dispatch(fetchWifiKeys(robot)),
    addKey: file => dispatch(addWifiKey(robot, file)),
    refresh: () => refreshActions.forEach(dispatch),
  }
}

export default connect<Props, OP, SP, _, _, _>(
  makeMapStateToProps,
  mapDispatchToProps
)(SelectNetwork)
