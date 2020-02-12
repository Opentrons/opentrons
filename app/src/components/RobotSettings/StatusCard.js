// @flow
// RobotSettings card for robot status
import * as React from 'react'
import { connect } from 'react-redux'
import capitalize from 'lodash/capitalize'

import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../robot'

import { Card, LabeledValue, OutlineButton } from '@opentrons/components'
import { CONNECTABLE } from '../../discovery'
import { CardContentHalf } from '../layout'

import type { State, Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery/types'

type OP = {| robot: ViewableRobot |}

type SP = {| status: string, connectButtonText: string |}

type DP = {| onClick: () => mixed |}

type Props = {| ...OP, ...SP, ...DP |}

const TITLE = 'Status'
const STATUS_LABEL = 'This robot is currently'
const STATUS_VALUE_DISCONNECTED = 'Unknown - connect to view status'
const STATUS_VALUE_DEFAULT = 'Idle'

export const StatusCard = connect<Props, OP, SP, DP, State, Dispatch>(
  mapStateToProps,
  mapDispatchToProps
)(StatusCardComponent)

function StatusCardComponent(props: Props) {
  const { robot, status, connectButtonText, onClick } = props
  const disabled = robot.status !== CONNECTABLE

  return (
    <Card title={TITLE} disabled={disabled}>
      <CardContentHalf>
        <LabeledValue label={STATUS_LABEL} value={status} />
      </CardContentHalf>
      <CardContentHalf>
        <OutlineButton onClick={onClick} disabled={disabled}>
          {connectButtonText}
        </OutlineButton>
      </CardContentHalf>
    </Card>
  )
}

function mapStateToProps(state: State, ownProps: OP): SP {
  const { robot } = ownProps
  const connected = robot.connected != null && robot.connected === true
  const sessionStatus = robotSelectors.getSessionStatus(state)
  const status = connected
    ? (sessionStatus && capitalize(sessionStatus)) || STATUS_VALUE_DEFAULT
    : STATUS_VALUE_DISCONNECTED

  const connectButtonText = connected ? 'disconnect' : 'connect'

  return { status, connectButtonText }
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: OP): DP {
  const { robot } = ownProps
  const onClickAction =
    robot.connected === true
      ? robotActions.disconnect()
      : robotActions.connect(robot.name)

  return {
    onClick: () => dispatch(onClickAction),
  }
}
