// @flow
// RobotSettings card for robot status
import * as React from 'react'
import {connect} from 'react-redux'
import {Link} from 'react-router-dom'

import type {State, Dispatch} from '../../types'
import type {Robot} from '../../robot'
import {
  fetchHealthAndIgnored,
  makeGetRobotHealth,
  makeGetAvailableRobotUpdate,
  type RobotHealth
} from '../../http-api-client'

import {RefreshCard, LabeledValue, OutlineButton} from '@opentrons/components'

type OwnProps = Robot & {
  updateUrl: string
}

type StateProps = {
  healthRequest: RobotHealth,
  availableUpdate: ?string
}

type DispatchProps = {
  fetchHealth: () => mixed
}

type Props = OwnProps & StateProps & DispatchProps

const TITLE = 'Information'
const NAME_LABEL = 'Robot Name'
const SERVER_VERSION_LABEL = 'Server version'
const FIRMWARE_VERSION_LABEL = 'Firmware version'

export default connect(makeMapStateToProps, mapDispatchToProps)(InformationCard)

function InformationCard (props: Props) {
  const {
    name,
    availableUpdate,
    fetchHealth,
    updateUrl,
    healthRequest: {inProgress, response: health}
  } = props

  const realName = (health && health.name) || name
  const version = (health && health.api_version) || 'Unknown'
  const firmwareVersion = (health && health.fw_version) || 'Unknown'
  const updateText = availableUpdate
    ? 'Update'
    : 'Updated'
  return (
    <RefreshCard
      watch={name}
      refresh={fetchHealth}
      refreshing={inProgress}
      title={TITLE}
    >
      <LabeledValue
        label={NAME_LABEL}
        value={realName}
      />
      <LabeledValue
        label={SERVER_VERSION_LABEL}
        value={version}
      />
      <LabeledValue
        label={FIRMWARE_VERSION_LABEL}
        value={firmwareVersion}
      />
      <OutlineButton
        Component={Link}
        to={updateUrl}
      >
        {updateText}
      </OutlineButton>
    </RefreshCard>
  )
}

function makeMapStateToProps () {
  const getRobotHealth = makeGetRobotHealth()
  const getAvailableRobotUpdate = makeGetAvailableRobotUpdate()

  return (state: State, ownProps: OwnProps): StateProps => ({
    healthRequest: getRobotHealth(state, ownProps),
    availableUpdate: getAvailableRobotUpdate(state, ownProps)
  })
}

function mapDispatchToProps (
  dispatch: Dispatch,
  ownProps: OwnProps
): DispatchProps {
  return {
    fetchHealth: () => dispatch(fetchHealthAndIgnored(ownProps))
  }
}
