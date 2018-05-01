// @flow
import * as React from 'react'

import type {CalibrateDeckProps} from './types'
import {SpinnerModalPage} from '@opentrons/components'

export default function RequestInProgressModal (props: CalibrateDeckProps) {
  // TODO (ka 2018-4-30): single message in place until api calls in place
  let message = 'Left pipette moving to the front and down.'
  return (
    <SpinnerModalPage
      titleBar={{
        title: props.title,
        subtitle: props.subtitle,
        back: {
          disabled: true
        }
      }}

      message={message}
    />
  )
}
