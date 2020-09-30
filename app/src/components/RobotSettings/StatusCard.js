// @flow
// RobotSettings card for robot status
import * as React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import capitalize from 'lodash/capitalize'

import {
  selectors as robotSelectors,
  actions as robotActions,
} from '../../robot'

import { Card, LabeledValue, OutlineButton, Icon } from '@opentrons/components'
import { CONNECTABLE } from '../../discovery'
import { CardContentHalf } from '../layout'

import type { Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery/types'

type Props = {| robot: ViewableRobot |}

// TODO(mc, 2020-03-30): i18n
const TITLE = 'Status'
const STATUS_LABEL = 'This robot is currently'
const STATUS_VALUE_DISCONNECTED = 'Unknown - connect to view status'
const STATUS_VALUE_NOT_CONNECTABLE = 'Not connectable'
const STATUS_VALUE_DEFAULT = 'Idle'
const CONNECT = 'connect'
const DISCONNECT = 'disconnect'

export function StatusCard(props: Props): React.Node {
  const { robot } = props
  const dispatch = useDispatch<Dispatch>()
  const connectable = robot.status === CONNECTABLE
  const connected = robot.connected != null && robot.connected === true
  const sessionStatus = useSelector(robotSelectors.getSessionStatus)
  const connectRequest = useSelector(robotSelectors.getConnectRequest)
  const connectButtonDisabled = !connectable || connectRequest.inProgress
  let status = STATUS_VALUE_DEFAULT

  if (!connectable) {
    status = STATUS_VALUE_NOT_CONNECTABLE
  } else if (!connected) {
    status = STATUS_VALUE_DISCONNECTED
  } else if (sessionStatus) {
    status = capitalize(sessionStatus)
  }

  const handleClick = () => {
    if (connected) {
      dispatch(robotActions.disconnect())
    } else {
      dispatch(robotActions.connect(robot.name))
    }
  }

  return (
    <Card title={TITLE}>
      <CardContentHalf>
        <LabeledValue label={STATUS_LABEL} value={status} />
      </CardContentHalf>
      <CardContentHalf>
        <OutlineButton onClick={handleClick} disabled={connectButtonDisabled}>
          {connected ? (
            DISCONNECT
          ) : connectRequest.name === robot.name ? (
            <Icon name="ot-spinner" height="1em" spin />
          ) : (
            CONNECT
          )}
        </OutlineButton>
      </CardContentHalf>
    </Card>
  )
}
