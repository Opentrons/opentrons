// @flow
import * as React from 'react'
import {connect} from 'react-redux'
import find from 'lodash/find'

import {
  NO_SECURITY,
  WPA_EAP_SECURITY,
  fetchWifiList,
  fetchWifiEapOptions,
  fetchWifiKeys,
  addWifiKey,
  configureWifi,
  makeGetRobotWifiList,
  makeGetRobotWifiEapOptions,
  makeGetRobotWifiKeys,
  makeGetRobotWifiConfigure,
} from '../../../http-api-client'

import {IntervalWrapper, SpinnerModal} from '@opentrons/components'
import {Portal} from '../../portal'
import ConnectModal from './ConnectModal'
import ConnectForm from './ConnectForm'
import SelectSsid from './SelectSsid'

import type {State, Dispatch} from '../../../types'
import type {ViewableRobot} from '../../../discovery'
import type {
  WifiNetworkList,
  WifiSecurityType,
  WifiEapOptionsList,
  WifiKeysList,
  WifiConfigureRequest,
} from '../../../http-api-client'

type OP = {robot: ViewableRobot}

type SP = {|
  list: ?WifiNetworkList,
  connectingTo: ?string,
  eapOptions: ?WifiEapOptionsList,
  keys: ?WifiKeysList,
|}

type DP = {|
  fetchList: () => mixed,
  fetchEapOptions: () => mixed,
  fetchKeys: () => mixed,
  addKey: (file: File) => mixed,
  configure: WifiConfigureRequest => mixed,
|}

type Props = {...$Exact<OP>, ...SP, ...DP}

type SelectNetworkState = {
  ssid: ?string,
  securityType: ?WifiSecurityType,
  modalOpen: boolean,
}

const LIST_REFRESH_MS = 15000

class SelectNetwork extends React.Component<Props, SelectNetworkState> {
  constructor (props) {
    super(props)
    // prepopulate selected SSID with currently connected network, if any
    this.state = {
      ssid: this.getActiveSsid(),
      securityType: null,
      modalOpen: false,
    }
  }

  setCurrentSsid = (_: string, ssid: string) => {
    const network = find(this.props.list, {ssid})

    if (network) {
      const securityType = network.securityType
      const nextState: $Shape<SelectNetworkState> = {
        ssid,
        securityType,
        modalOpen: securityType !== NO_SECURITY,
      }

      if (!nextState.modalOpen) {
        this.props.configure({ssid})
      } else if (securityType === WPA_EAP_SECURITY || !securityType) {
        this.props.fetchEapOptions()
        this.props.fetchKeys()
      }

      this.setState(nextState)
    }
  }

  closeConnectForm = () => this.setState({securityType: null, modalOpen: false})

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
    const {
      list,
      connectingTo,
      eapOptions,
      keys,
      fetchList,
      configure,
      addKey,
    } = this.props
    const {ssid, securityType, modalOpen} = this.state

    return (
      <IntervalWrapper refresh={fetchList} interval={LIST_REFRESH_MS}>
        <SelectSsid
          list={list}
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
          {ssid &&
            modalOpen && (
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
        </Portal>
      </IntervalWrapper>
    )
  }
}

function makeMapStateToProps (): (State, OP) => SP {
  const getListCall = makeGetRobotWifiList()
  const getEapCall = makeGetRobotWifiEapOptions()
  const getKeysCall = makeGetRobotWifiKeys()
  const getConfigureCall = makeGetRobotWifiConfigure()

  return (state, ownProps) => {
    const {robot} = ownProps
    const {response: listResponse} = getListCall(state, robot)
    const {response: eapResponse} = getEapCall(state, robot)
    const {response: keysResponse} = getKeysCall(state, robot)
    const {
      request: cfgRequest,
      inProgress: cfgInProgress,
      error: cfgError,
    } = getConfigureCall(state, robot)

    return {
      list: listResponse && listResponse.list,
      eapOptions: eapResponse && eapResponse.options,
      keys: keysResponse && keysResponse.keys,
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
    fetchKeys: () => dispatch(fetchWifiKeys(robot)),
    addKey: file => dispatch(addWifiKey(robot, file)),
    configure: params => dispatch(configureWifi(robot, params)),
  }
}

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(SelectNetwork)
