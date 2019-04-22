// @flow
import * as React from 'react'
import { connect } from 'react-redux'

import { makeGetRobotUpdateRequest } from '../../../http-api-client'

import { SpinnerModal } from '@opentrons/components'
import UpdateRobotModal from './UpdateRobotModal'
import RestartRobotModal from './RestartRobotModal'

import type { State } from '../../../types'
import type { ViewableRobot } from '../../../discovery'
import type { ShellUpdateState } from '../../../shell'
import type { RobotServerUpdate } from '../../../http-api-client'

type OP = {| robot: ViewableRobot, appUpdate: ShellUpdateState |}

type SP = {| updateRequest: RobotServerUpdate |}

type Props = { ...OP, ...SP }

export default connect<Props, OP, SP, _, _, _>(makeMapStateToProps)(UpdateRobot)

function UpdateRobot(props: Props) {
  const { updateRequest, robot, appUpdate } = props

  if (updateRequest.response) {
    return <RestartRobotModal robot={robot} />
  }

  if (updateRequest.inProgress) {
    return <SpinnerModal message="Robot is updating" alertOverlay />
  }

  return <UpdateRobotModal robot={robot} appUpdate={appUpdate} />
}

function makeMapStateToProps(): (State, OP) => SP {
  const getRobotUpdateRequest = makeGetRobotUpdateRequest()

  return (state, ownProps) => ({
    updateRequest: getRobotUpdateRequest(state, ownProps.robot),
  })
}
