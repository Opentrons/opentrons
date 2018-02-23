// @flow
// RobotSettings card for robot status
import * as React from 'react'
import {connect} from 'react-redux'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'
import {
  fetchHealth,
  makeGetRobotHealth,
  type RobotHealth
} from '../../http-api-client'

import {Card, LabeledValue, OutlineButton} from '@opentrons/components'

type OwnProps = Robot

type StateProps = {
  healthRequest: RobotHealth
}

type DispatchProps = {
  fetchHealth: () => *
}

type Props = OwnProps & StateProps & DispatchProps

const TITLE = 'Information'
const NAME_LABEL = 'Robot Name'
const SERVER_VERSION_LABEL = 'Server version'

class InformationCard extends React.Component<Props> {
  render () {
    const {name, healthRequest: {response: health}} = this.props
    const realName = (health && health.name) || name
    const version = (health && health.api_version) || 'Unknown'

    return (
      <Card title={TITLE}>
        <LabeledValue
          label={NAME_LABEL}
          value={realName}
        />
        <LabeledValue
          label={SERVER_VERSION_LABEL}
          value={version}
        />
        <OutlineButton disabled>
          Updated
        </OutlineButton>
      </Card>
    )
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

export default connect(makeMapStateToProps, mapDispatchToProps)(InformationCard)

function makeMapStateToProps () {
  const getRobotHealth = makeGetRobotHealth()

  return (state: State, ownProps: OwnProps): StateProps => ({
    healthRequest: getRobotHealth(state, ownProps)
  })
}

function mapDispatchToProps (
  dispatch: Dispatch,
  ownProps: OwnProps
): DispatchProps {
  return {
    fetchHealth: () => dispatch(fetchHealth(ownProps))
  }
}
