// @flow
// RobotSettings card for robot status
import * as React from 'react'
import {connect} from 'react-redux'

import type {Dispatch} from '../../types'
import type {Robot} from '../../robot'
import {fetchHealth} from '../../http-api-client'

import {
  Card,
  LabeledValue,
  OutlineButton,
  Icon,
  SPINNER
} from '@opentrons/components'

type OwnProps = Robot

type DispatchProps = {
  fetchHealth: () => *
}

type Props = OwnProps & DispatchProps

const TITLE = 'Information'
const NAME_LABEL = 'Robot Name'
const SERVER_VERSION_LABEL = 'Server version'

class InformationCard extends React.Component<Props> {
  render () {
    const {name} = this.props

    return (
      <Card title={TITLE}>
        <LabeledValue
          label={NAME_LABEL}
          value={name}
        />
        <LabeledValue
          label={SERVER_VERSION_LABEL}
          value={this.getServerVersion()}
        />
        <OutlineButton disabled>
          Updated
        </OutlineButton>
      </Card>
    )
  }

  getServerVersion (): React.Node {
    const {health} = this.props

    if (!health) return null
    if (health.inProgress) return (<Icon name={SPINNER} spin />)
    if (health.error) return 'Error fetching version'

    return health.response && health.response.api_version
  }

  componentDidMount () {
    this.props.fetchHealth()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.name !== this.props.name) {
      this.props.fetchHealth()
    }
  }
}

export default connect(null, mapDispatchToProps)(InformationCard)

function mapDispatchToProps (
  dispatch: Dispatch,
  ownProps: OwnProps
): DispatchProps {
  return {
    fetchHealth: () => dispatch(fetchHealth(ownProps))
  }
}
