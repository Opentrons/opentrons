// @flow
// RobotSettings card for wifi status
import * as React from 'react'
import {connect} from 'react-redux'

import {CONNECTABLE, startDiscovery} from '../../discovery'
import {
  fetchNetworkingStatus,
  fetchWifiList,
  configureWifi,
  clearConfigureWifiResponse,
  makeGetRobotWifiList,
  makeGetRobotWifiConfigure,
} from '../../http-api-client'

import {RefreshCard, LabeledValue} from '@opentrons/components'
import {CardContentFull} from '../layout'
import WifiConnectForm from './WifiConnectForm'
import WifiConnectModal from './WifiConnectModal'

import type {State, Dispatch} from '../../types'
import type {ViewableRobot} from '../../discovery'
import type {FetchWifiListCall, ConfigureWifiCall} from '../../http-api-client'

type OP = {robot: ViewableRobot}

type SP = {|
  listRequest: FetchWifiListCall,
  configureRequest: ConfigureWifiCall,
|}

type DP = {|
  refresh: () => mixed,
  configure: (?string, ?string) => mixed,
  clearSuccessfulConfigure: () => mixed,
  clearFailedConfigure: () => mixed,
|}

type Props = {...$Exact<OP>, ...SP, ...DP}

const TITLE = 'Connectivity'
const CONNECTED_BY_LABEL = 'Connected by'

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(ConnectivityCard)

function ConnectivityCard (props: Props) {
  const {
    refresh,
    clearSuccessfulConfigure,
    clearFailedConfigure,
    configure,
    robot: {ip, local, name, status},
    listRequest: {response: listResponse},
    configureRequest: {
      inProgress: configInProgress,
      response: configResponse,
      error: configError,
    },
  } = props
  const disabled = status !== CONNECTABLE
  const list = (listResponse && listResponse.list) || []

  const active = list.find(network => network.active)
  const activeSsid = active && active.ssid
  const connectedBy = local ? 'USB' : `${activeSsid || ''} (WiFi)`

  const listOptions = list.map(({active, ssid}) => ({
    name: active ? `${ssid} *` : ssid,
    value: ssid,
  }))

  return (
    <React.Fragment>
      <RefreshCard
        watch={name}
        refresh={refresh}
        refreshing={configInProgress}
        title={TITLE}
        disabled={disabled}
        column
      >
        <CardContentFull>
          <LabeledValue
            label={CONNECTED_BY_LABEL}
            value={`${connectedBy} - ${ip}`}
          />
          <WifiConnectForm
            key={name}
            disabled={disabled || configInProgress}
            activeSsid={activeSsid}
            networks={listOptions}
            onSubmit={configure}
          />
        </CardContentFull>
      </RefreshCard>
      {(!!configError || !!configResponse) && (
        <WifiConnectModal
          error={configError}
          response={configResponse}
          close={configError ? clearFailedConfigure : clearSuccessfulConfigure}
        />
      )}
    </React.Fragment>
  )
}

function makeMapStateToProps () {
  const getWifiList = makeGetRobotWifiList()
  const getWifiConfigure = makeGetRobotWifiConfigure()

  return (state: State, ownProps: OP): SP => ({
    listRequest: getWifiList(state, ownProps.robot),
    configureRequest: getWifiConfigure(state, ownProps.robot),
  })
}

function mapDispatchToProps (dispatch: Dispatch, ownProps: OP): DP {
  const {robot} = ownProps
  const configure = (ssid, psk) => dispatch(configureWifi(robot, {ssid, psk}))
  const refresh = () => {
    // send these requests simultaneously
    dispatch(fetchNetworkingStatus(robot))
    dispatch(fetchWifiList(robot))
  }

  // TODO(mc, 2018-02-26): handle refreshing the list and kicking off dispatch
  //   more elegantly and closer to the configure response
  const clearConfigureAction = clearConfigureWifiResponse(robot)
  const clearFailedConfigure = () => dispatch(clearConfigureAction)
  const clearSuccessfulConfigure = () =>
    Promise.resolve()
      .then(refresh)
      .then(() => dispatch(startDiscovery()))
      .then(() => dispatch(clearConfigureAction))

  return {
    refresh,
    configure,
    clearSuccessfulConfigure,
    clearFailedConfigure,
  }
}
