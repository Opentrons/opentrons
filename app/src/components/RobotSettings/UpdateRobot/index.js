// @flow
import * as React from 'react'
import {connect} from 'react-redux'

import {makeGetRobotUpdateRequest} from '../../../http-api-client'

import {SpinnerModal} from '@opentrons/components'
import UpdateRobotModal from './UpdateRobotModal'
import RestartRobotModal from './RestartRobotModal'

import type {State} from '../../../types'
import type {ViewableRobot} from '../../../discovery'
import type {ShellUpdateState} from '../../../shell'
import type {RobotServerUpdate} from '../../../http-api-client'

type OP = {robot: ViewableRobot, appUpdate: ShellUpdateState}

type SP = {|
  updateRequest: RobotServerUpdate,
|}

type Props = {
  ...$Exact<OP>,
  ...SP,
}

export default connect(
  makeMapStateToProps,
  null
)(UpdateRobot)

function UpdateRobot (props: Props) {
  const {updateRequest, robot, appUpdate} = props
  if (updateRequest.response) {
    return <RestartRobotModal robot={robot} />
  }
  if (updateRequest.inProgress) {
    // TODO (ka 2018-11-27): Clarify update message with UX
    return <SpinnerModal message="Robot is updating" alertOverlay />
  } else {
    return <UpdateRobotModal robot={robot} appUpdate={appUpdate} />
  }
}

function makeMapStateToProps (): (State, OP) => Props {
  const getRobotUpdateRequest = makeGetRobotUpdateRequest()

  return (state, ownProps) => {
    return {
      ...ownProps,
      updateRequest: getRobotUpdateRequest(state, ownProps.robot),
    }
  }
}
