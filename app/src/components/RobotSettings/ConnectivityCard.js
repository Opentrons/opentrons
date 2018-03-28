// @flow
// RobotSettings card for wifi status
import * as React from 'react'
import {connect} from 'react-redux'

import type {State, Dispatch} from '../../types'
import {actions as robotActions, type Robot} from '../../robot'

import {
  fetchWifiList,
  configureWifi,
  setConfigureWifiBody,
  clearConfigureWifiResponse,
  makeGetRobotWifiList,
  makeGetRobotWifiConfigure,
  type RobotWifiList,
  type RobotWifiConfigure
} from '../../http-api-client'

import {RefreshCard, LabeledValue} from '@opentrons/components'

import WifiConnectForm from './WifiConnectForm'
import WifiConnectModal from './WifiConnectModal'

type OwnProps = Robot

type StateProps = {
  listRequest: RobotWifiList,
  configureRequest: RobotWifiConfigure,
}

type DispatchProps = {
  fetchList: () => *,
  configure: () => *,
  setConfigureBody: ({['ssid' | 'psk']: string}) => *,
  clearSuccessfulConfigure: () => *,
  clearFailedConfigure: () => *
}

type Props = OwnProps & StateProps & DispatchProps

const TITLE = 'Connectivity'
const CONNECTED_BY_LABEL = 'Connected by'

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(ConnectivityCard)

function ConnectivityCard (props: Props) {
  const {
    ip,
    wired,
    name,
    fetchList,
    setConfigureBody,
    clearSuccessfulConfigure,
    clearFailedConfigure,
    configure,
    listRequest: {
      inProgress: listInProgress,
      response: listResponse
    },
    configureRequest: {
      inProgress: configInProgress,
      request: configRequest,
      response: configResponse,
      error: configError
    }
  } = props

  const credentials = configRequest || {ssid: '', psk: ''}
  const list = (listResponse && listResponse.list) || []

  const active = list.find((network) => network.active)
  const listOptions = list.map(({active, ssid}) => ({
    name: (active ? `${ssid} *` : ssid),
    value: ssid
  }))

  return (
    <div>
      <RefreshCard
        watch={name}
        refresh={fetchList}
        refreshing={listInProgress || configInProgress}
        title={TITLE}
        column
      >
        <LabeledValue
          label={CONNECTED_BY_LABEL}
          value={`${wired ? 'USB' : 'WiFi'} - ${ip}`}
        />
        <WifiConnectForm
          disabled={!wired || configInProgress}
          ssid={credentials.ssid}
          psk={credentials.psk}
          activeSsid={active && active.ssid}
          networks={listOptions}
          onChange={setConfigureBody}
          onSubmit={configure}
        />
      </RefreshCard>
      {(!!configError || !!configResponse) && (
        <WifiConnectModal
          onClose={(configError
            ? clearFailedConfigure
            : clearSuccessfulConfigure
          )}
          error={configError}
          response={configResponse}
        />
      )}
    </div>
  )
}

function makeMapStateToProps () {
  const getWifiList = makeGetRobotWifiList()
  const getWifiConfigure = makeGetRobotWifiConfigure()

  return (state: State, ownProps: OwnProps): StateProps => ({
    listRequest: getWifiList(state, ownProps),
    configureRequest: getWifiConfigure(state, ownProps)
  })
}

function mapDispatchToProps (
  dispatch: Dispatch,
  ownProps: OwnProps
): DispatchProps {
  const fetchList = () => dispatch(fetchWifiList(ownProps))
  const configure = () => dispatch(configureWifi(ownProps))

  const setConfigureBody = (update) => {
    dispatch(setConfigureWifiBody(ownProps, update))
  }

  // TODO(mc, 2018-02-26): handle refreshing the list and kicking off dispatch
  //   more elegantly and closer to the configure response
  const clearConfigureAction = clearConfigureWifiResponse(ownProps)
  const clearFailedConfigure = () => dispatch(clearConfigureAction)
  const clearSuccessfulConfigure = () => fetchList()
    .then(() => dispatch(robotActions.discover()))
    .then(() => dispatch(clearConfigureAction))

  return {
    fetchList,
    configure,
    setConfigureBody,
    clearSuccessfulConfigure,
    clearFailedConfigure
  }
}
