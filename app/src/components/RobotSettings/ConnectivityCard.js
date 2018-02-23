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

import {Card, LabeledValue} from '@opentrons/components'

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
  clearConfigureResponse: () => *
}

type Props = OwnProps & StateProps & DispatchProps

const TITLE = 'Connectivity'
const CONNECTED_BY_LABEL = 'Connected by'

class ConnectivityCard extends React.Component<Props> {
  render () {
    const {
      ip,
      wired,
      setConfigureBody,
      clearConfigureResponse,
      configure,
      listRequest: {
        response: listResponse
      },
      configureRequest: {
        inProgress: configInProgress,
        request: configRequest,
        response: configResponse,
        error: configError
      }
    } = this.props

    const credentials = configRequest || {ssid: '', psk: ''}
    const list = (listResponse && listResponse.list) || []

    const active = list.find((network) => network.active)
    const listOptions = list.map(({active, ssid}) => ({
      name: (active ? `${ssid} *` : ssid),
      value: ssid
    }))

    return (
      <Card title={TITLE} column>
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
        {(configError || configResponse) && (
          <WifiConnectModal
            onClose={clearConfigureResponse}
            error={configError}
            response={configResponse}
          />
        )}
      </Card>
    )
  }

  componentDidMount () {
    this.props.fetchList()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.name !== this.props.name) {
      this.props.fetchList()
    }
  }
}

export default connect(
  makeMapStateToProps,
  mapDispatchToProps
)(ConnectivityCard)

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
  const configure = () => {
    dispatch(configureWifi(ownProps))
      .then(fetchList)
      .then(() => dispatch(robotActions.discover()))
  }

  const setConfigureBody = (update) => {
    dispatch(setConfigureWifiBody(ownProps, update))
  }
  const clearConfigureResponse = () => {
    dispatch(clearConfigureWifiResponse(ownProps))
  }

  return {fetchList, configure, setConfigureBody, clearConfigureResponse}
}
