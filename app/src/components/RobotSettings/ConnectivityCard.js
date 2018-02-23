// @flow
// RobotSettings card for wifi status
import * as React from 'react'
import {connect} from 'react-redux'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'

import {
  fetchWifiList,
  configureWifi,
  setConfigureWifiBody,
  makeGetRobotWifiList,
  makeGetRobotWifiConfigure,
  type RobotWifiList,
  type RobotWifiConfigure
} from '../../http-api-client'

import {Card, LabeledValue} from '@opentrons/components'

import ConfigureWifiForm from './ConfigureWifiForm'

type OwnProps = Robot

type StateProps = {
  listRequest: RobotWifiList,
  configureRequest: RobotWifiConfigure,
}

type DispatchProps = {
  fetchList: () => *,
  configure: () => *,
  setConfigureBody: ({['ssid' | 'psk']: string}) => *
}

type Props = OwnProps & StateProps & DispatchProps

const TITLE = 'Connectivity'
const CONNECTED_BY_LABEL = 'Connected by'

class ConnectivityCard extends React.Component<Props> {
  render () {
    const {
      wired,
      listRequest,
      configureRequest,
      setConfigureBody,
      configure
    } = this.props

    const credentials = configureRequest.request || {}
    const list = (listRequest.response && listRequest.response.list) || []
    const active = list.find((network) => network.active)
    const listOptions = list.map(({active, ssid}) => ({
      name: (active ? `${ssid} *` : ssid),
      value: ssid
    }))

    return (
      <Card title={TITLE} column>
        <LabeledValue
          label={CONNECTED_BY_LABEL}
          value={wired ? 'USB' : 'WiFi'}
        />
        <ConfigureWifiForm
          wired={wired}
          ssid={credentials.ssid}
          psk={credentials.psk}
          activeSsid={active && active.ssid}
          networks={listOptions}
          onChange={setConfigureBody}
          onSubmit={configure}
        />
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
  const configure = () => dispatch(configureWifi(ownProps)).then(fetchList)
  const setConfigureBody = (update) => {
    return dispatch(setConfigureWifiBody(ownProps, update))
  }

  return {fetchList, configure, setConfigureBody}
}
