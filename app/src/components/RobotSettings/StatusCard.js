// @flow
// RobotSettings card for robot status
import * as React from 'react'
import {connect} from 'react-redux'
import capitalize from 'lodash/capitalize'

import type {State, Dispatch} from '../../types'
import {
  selectors as robotSelectors,
  actions as robotActions,
  type Robot,
} from '../../robot'

import {Card, LabeledValue, OutlineButton} from '@opentrons/components'
import {CardContentHalf} from '../layout'

type OwnProps = Robot

type StateProps = {
  status: string,
  connectButtonText: string,
}

type DispatchProps = {
  onClick: () => *,
}

type Props = OwnProps & StateProps & DispatchProps

const TITLE = 'Status'
const STATUS_LABEL = 'This robot is currently'
const STATUS_VALUE_DISCONNECTED = 'Unknown - connect to view status'
const STATUS_VALUE_DEFAULT = 'Idle'

export default connect(mapStateToProps, mapDispatchToProps)(StatusCard)

function StatusCard (props: Props) {
  const {status, connectButtonText, onClick} = props

  return (
    <Card title={TITLE}>
      <CardContentHalf>
        <LabeledValue
          label={STATUS_LABEL}
          value={status}
        />
      </CardContentHalf>
      <CardContentHalf>
        <OutlineButton onClick={onClick}>
          {connectButtonText}
        </OutlineButton>
      </CardContentHalf>
    </Card>
  )
}

function mapStateToProps (state: State, ownProps: OwnProps): StateProps {
  const {isConnected} = ownProps
  const sessionStatus = robotSelectors.getSessionStatus(state)
  const status = isConnected
    ? (sessionStatus && capitalize(sessionStatus)) || STATUS_VALUE_DEFAULT
    : STATUS_VALUE_DISCONNECTED

  const connectButtonText = isConnected
    ? 'disconnect'
    : 'connect'

  return {status, connectButtonText}
}

function mapDispatchToProps (
  dispatch: Dispatch,
  ownProps: OwnProps
): DispatchProps {
  const {name, isConnected} = ownProps
  const onClickAction = isConnected
    ? robotActions.disconnect()
    : robotActions.connect(name)

  return {
    onClick: () => dispatch(onClickAction),
  }
}
