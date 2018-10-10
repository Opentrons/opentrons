// @flow
// RobotSettings card for robot status
import * as React from 'react'
import {connect} from 'react-redux'
import capitalize from 'lodash/capitalize'

import {selectors as robotSelectors, actions as robotActions} from '../../robot'

import {Card, LabeledValue, OutlineButton} from '@opentrons/components'
import {CardContentHalf} from '../layout'

import type {State, Dispatch} from '../../types'
import type {ViewableRobot} from '../../discovery'

type OwnProps = {robot: ViewableRobot}

type StateProps = {|
  status: string,
  connectButtonText: string,
|}

type DispatchProps = {|
  onClick: () => mixed,
|}

type Props = {...$Exact<OwnProps>, ...StateProps, ...DispatchProps}

const TITLE = 'Status'
const STATUS_LABEL = 'This robot is currently'
const STATUS_VALUE_DISCONNECTED = 'Unknown - connect to view status'
const STATUS_VALUE_DEFAULT = 'Idle'

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(StatusCard)

function StatusCard (props: Props) {
  const {status, connectButtonText, onClick} = props
  return (
    <Card title={TITLE}>
      <CardContentHalf>
        <LabeledValue label={STATUS_LABEL} value={status} />
      </CardContentHalf>
      <CardContentHalf>
        <OutlineButton onClick={onClick}>{connectButtonText}</OutlineButton>
      </CardContentHalf>
    </Card>
  )
}

function mapStateToProps (state: State, ownProps: OwnProps): StateProps {
  const {robot} = ownProps
  const connected = robot.connected != null && robot.connected === true
  const sessionStatus = robotSelectors.getSessionStatus(state)
  const status = connected
    ? (sessionStatus && capitalize(sessionStatus)) || STATUS_VALUE_DEFAULT
    : STATUS_VALUE_DISCONNECTED

  const connectButtonText = connected ? 'disconnect' : 'connect'

  return {status, connectButtonText}
}

function mapDispatchToProps (
  dispatch: Dispatch,
  ownProps: OwnProps
): DispatchProps {
  const {robot} = ownProps
  const onClickAction =
    robot.connected === true
      ? robotActions.disconnect()
      : robotActions.connect(robot.name)

  return {
    onClick: () => dispatch(onClickAction),
  }
}
