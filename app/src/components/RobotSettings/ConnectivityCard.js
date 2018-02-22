// @flow
// RobotSettings card for wifi status
import * as React from 'react'
import {connect} from 'react-redux'

import type {Dispatch} from '../../types'
import type {Robot} from '../../robot'

import {
  fetchWifiList,
  configureWifi,
  setConfigureWifiBody
} from '../../http-api-client'

import {Card, LabeledValue} from '@opentrons/components'

import ConfigureWifiForm from './ConfigureWifiForm'

type OwnProps = Robot

type DispatchProps = {
  fetchList: () => *,
  configure: () => *,
  setConfigureBody: ({['ssid' | 'psk']: string}) => *
}

type Props = OwnProps & DispatchProps

const TITLE = 'Connectivity'
const CONNECTED_TO_LABEL = 'Connected to'

class ConnectivityCard extends React.Component<Props> {
  render () {
    const {wired, setConfigureBody, configure} = this.props
    const listInfo = this.getNetworkInfo()
    const configInfo = this.getConfigureInfo()

    return (
      <Card title={TITLE} column>
        <LabeledValue
          label={CONNECTED_TO_LABEL}
          value={this.renderConnectedTo(listInfo)}
        />
        <ConfigureWifiForm
          wired={wired}
          ssid={configInfo.ssid}
          psk={configInfo.psk}
          activeSsid={listInfo.current}
          networks={listInfo.options}
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

  // TODO(mc, 2018-02-21): NEXT PR - this mess should be in a selector
  getNetworkInfo () {
    const {wifi} = this.props
    const listCall = (wifi && wifi.list) || {}
    const inProgress = listCall.inProgress
    const error = listCall.error
    const list = (listCall.response && listCall.response.list) || []

    // dedupe SSIDs in the list
    const {current, uniqueIds, optsById} = list.reduce((result, network) => {
      const {ssid, active} = network

      if (!result.optsById[ssid]) {
        result.uniqueIds.push(ssid)
        result.optsById[ssid] = {name: ssid, value: ssid}
      }

      if (active) {
        result.current = ssid
        result.optsById[ssid].name = `${ssid} *`
      }

      return result
    }, {current: '', uniqueIds: [], optsById: {}})

    const options = uniqueIds.map((s) => optsById[s])

    return {current, inProgress, error, options}
  }

  // TODO(mc, 2018-02-21): NEXT PR - selector
  getConfigureInfo () {
    const {wifi} = this.props
    const configureCall = (wifi && wifi.configure) || {}
    const request = (configureCall && configureCall.request) || {}

    return request
  }

  renderConnectedTo (info) {
    if (this.props.wired) return 'USB'
    return info.current
  }
}

export default connect(null, mapDispatchToProps)(ConnectivityCard)

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
