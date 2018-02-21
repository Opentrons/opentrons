// @flow
// RobotSettings card for wifi status
import * as React from 'react'
import {connect} from 'react-redux'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'

import {fetchWifiList} from '../../http-api-client'

import {
  Card,
  LabeledValue,
  Icon,
  SPINNER
} from '@opentrons/components'

type OwnProps = Robot

type StateProps = {}

type DispatchProps = {
  fetchWifiList: () => *,
}

type Props = OwnProps & StateProps & DispatchProps

const TITLE = 'Connectivity'
const CONNECTED_TO_LABEL = 'Connected to'

class ConnectivityCard extends React.Component<Props> {
  render () {
    return (
      <Card title={TITLE} column>
        <LabeledValue
          label={CONNECTED_TO_LABEL}
          value={this.getConnectedTo()}
        />
      </Card>
    )
  }

  componentDidMount () {
    this.props.fetchWifiList()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.name !== this.props.name) {
      this.props.fetchWifiList()
    }
  }

  getConnectedTo (): React.Node {
    const {wired, wifi} = this.props

    if (wired) return 'USB'
    if (!wifi || !wifi.list) return ''
    if (wifi.list.inProgress) return (<Icon name={SPINNER} spin />)
    if (wifi.list.error) return 'Error retrieving network list'

    const list = (wifi.list.response && wifi.list.response.list)
    const current = list && list.find((network) => network.active)

    return current && current.ssid
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ConnectivityCard)

function mapStateToProps (state: State, ownProps: OwnProps): StateProps {
  return {}
}

function mapDispatchToProps (
  dispatch: Dispatch,
  ownProps: OwnProps
): DispatchProps {
  return {
    fetchWifiList: () => dispatch(fetchWifiList(ownProps))
  }
}
