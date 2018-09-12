// @flow
import * as React from 'react'

import type {ChangePipetteProps} from './types'
import {SpinnerModalPage} from '@opentrons/components'
// TODO (ka 2018-4-10): move this component to util/ or at least up a level for reuse for tip probe
export default function RequestInProgressModal (props: ChangePipetteProps) {
  let message = props.mount === 'right'
    ? 'Right pipette carriage moving'
    : 'Left pipette carriage moving'

  if (props.moveRequest.inProgress) {
    message += props.mount === 'right'
      ? ' to front and left.'
      : ' to front and right.'
  } else if (props.homeRequest.inProgress) {
    message += ' up.'
  }

  return (
    <SpinnerModalPage
      titleBar={{
        title: props.title,
        subtitle: props.subtitle,
        back: {
          disabled: true,
        },
      }}

      message={message}
    />
  )
}
