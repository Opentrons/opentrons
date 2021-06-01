import * as React from 'react'

import { HOMING, MOVING } from '../../redux/robot-controls'
import { RIGHT } from '../../redux/pipettes'
import { SpinnerModalPage } from '@opentrons/components'
import type { MovementStatus } from '../../redux/robot-controls/types'
import type { Mount } from '../../redux/pipettes/types'

// TODO(mc, 2020-01-06): i18n
const LEFT_PIP = 'Left pipette'
const RIGHT_PIP = 'Right pipette'
const CARRIAGE_MOVING = 'carriage moving'
const TO_FRONT_AND_LEFT = 'to front and left'
const TO_FRONT_AND_RIGHT = 'to front and right'
const UP = 'up'
const ROBOT_IS_HOMING = 'Robot is homing'

interface Props {
  title: string
  subtitle: string
  mount: Mount
  movementStatus: MovementStatus
  isPipetteHoming: boolean
}

export function RequestInProgressModal(props: Props): JSX.Element {
  const { title, subtitle, mount, movementStatus, isPipetteHoming } = props
  let message = `${mount === RIGHT ? RIGHT_PIP : LEFT_PIP} ${CARRIAGE_MOVING}`

  if (movementStatus === MOVING) {
    message += ` ${mount === RIGHT ? TO_FRONT_AND_LEFT : TO_FRONT_AND_RIGHT}.`
  } else if (movementStatus === HOMING) {
    if (isPipetteHoming) {
      message += ` ${UP}.`
    } else {
      message = ROBOT_IS_HOMING
    }
  }

  return (
    <SpinnerModalPage
      titleBar={{ title, subtitle, back: { disabled: true } }}
      message={message}
    />
  )
}
