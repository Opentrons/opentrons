// @flow
import * as React from 'react'

import { SpinnerModalPage } from '@opentrons/components'
import { HOMING, MOVING } from '../../robot-controls'
import { RIGHT } from '../../pipettes'
import type { MovementStatus } from '../../robot-controls/types'
import type { Mount } from '../../pipettes/types'

// TODO(mc, 2020-01-06): i18n
const LEFT_PIP = 'Left pipette'
const RIGHT_PIP = 'Right pipette'
const CARRIAGE_MOVING = 'carriage moving'
const TO_FRONT_AND_LEFT = 'to front and left'
const TO_FRONT_AND_RIGHT = 'to front and right'
const UP = 'up'

type Props = {|
  title: string,
  subtitle: string,
  mount: Mount,
  movementStatus: MovementStatus,
|}

export function RequestInProgressModal(props: Props): React.Node {
  const { title, subtitle, mount, movementStatus } = props
  let message = `${mount === RIGHT ? RIGHT_PIP : LEFT_PIP} ${CARRIAGE_MOVING}`

  if (movementStatus === MOVING) {
    message += ` ${mount === RIGHT ? TO_FRONT_AND_LEFT : TO_FRONT_AND_RIGHT}.`
  } else if (movementStatus === HOMING) {
    message += ` ${UP}.`
  }

  return (
    <SpinnerModalPage
      titleBar={{ title, subtitle, back: { disabled: true } }}
      message={message}
    />
  )
}
