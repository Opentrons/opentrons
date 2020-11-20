// @flow
// "Robot Controls" card
import * as React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Card, LabeledToggle, LabeledButton } from '@opentrons/components'

import {
  home,
  fetchLights,
  updateLights,
  getLightsOn,
  ROBOT,
} from '../../robot-controls'
import { restartRobot } from '../../robot-admin'
import { selectors as robotSelectors } from '../../robot'
import { CONNECTABLE } from '../../discovery'
import {
  DISABLED_CANNOT_CONNECT,
  DISABLED_CONNECT_TO_ROBOT,
  DISABLED_PROTOCOL_IS_RUNNING,
} from './constants'

import type { State, Dispatch } from '../../types'
import type { ViewableRobot } from '../../discovery/types'

type Props = {|
  robot: ViewableRobot,
|}

const TITLE = 'Robot Controls'

export function ControlsCard(props: Props): React.Node {
  const dispatch = useDispatch<Dispatch>()
  const { robot } = props
  const { name: robotName, status } = robot
  const lightsOn = useSelector((state: State) => getLightsOn(state, robotName))
  const isRunning = useSelector(robotSelectors.getIsRunning)
  const notConnectable = status !== CONNECTABLE
  const toggleLights = () => dispatch(updateLights(robotName, !lightsOn))

  React.useEffect(() => {
    dispatch(fetchLights(robotName))
  }, [dispatch, robotName])

  let buttonDisabledReason = null
  if (notConnectable) {
    buttonDisabledReason = DISABLED_CANNOT_CONNECT
  } else if (!robot.connected) {
    buttonDisabledReason = DISABLED_CONNECT_TO_ROBOT
  } else if (isRunning) {
    buttonDisabledReason = DISABLED_PROTOCOL_IS_RUNNING
  }

  const buttonDisabled = Boolean(buttonDisabledReason)

  return (
    <Card title={TITLE}>
      <LabeledButton
        label="Home all axes"
        buttonProps={{
          onClick: () => dispatch(home(robotName, ROBOT)),
          disabled: buttonDisabled,
          children: 'Home',
        }}
      >
        <p>Return robot to starting position.</p>
      </LabeledButton>
      <LabeledButton
        label="Restart robot"
        buttonProps={{
          onClick: () => dispatch(restartRobot(robotName)),
          disabled: buttonDisabled,
          children: 'Restart',
        }}
      >
        <p>Restart robot.</p>
      </LabeledButton>
      <LabeledToggle
        label="Lights"
        toggledOn={Boolean(lightsOn)}
        onClick={toggleLights}
        disabled={buttonDisabled}
      >
        <p>Control lights on deck.</p>
      </LabeledToggle>
    </Card>
  )
}
