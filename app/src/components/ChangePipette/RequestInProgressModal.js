// @flow
import * as React from 'react'

import { HOMING, MOVING } from '../../robot-controls'
import { RIGHT } from '../../pipettes'
import { SpinnerModalPage } from '@opentrons/components'
import type { MovementStatus } from '../../robot-controls/types'
import type { Mount } from '../../pipettes/types'

type Props = {|
  title: string,
  subtitle: string,
  mount: Mount,
  movementStatus: MovementStatus,
|}

export function RequestInProgressModal(props: Props) {
  const { title, subtitle, mount, movementStatus } = props
  let message = `${mount === RIGHT ? 'Right' : 'Left'} pipette carriage moving`

  if (movementStatus === MOVING) {
    message +=
      props.mount === 'right' ? ' to front and left.' : ' to front and right.'
  } else if (movementStatus === HOMING) {
    message += ' up.'
  }

  return (
    <SpinnerModalPage
      titleBar={{ title, subtitle, back: { disabled: true } }}
      message={message}
    />
  )
}
