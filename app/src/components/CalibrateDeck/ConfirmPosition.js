// @flow
import * as React from 'react'
import type {CalibrateDeckStartedProps} from './types'
import {PrimaryButton} from '@opentrons/components'
import JogControls from '../JogControls'
import Instructions from './Instructions'

export default function ConfirmPosition (props: CalibrateDeckStartedProps) {
  return (
    <div>
      <Instructions {...props} />
      <JogControls {...props} />
      <PrimaryButton disabled>
        Save Calibration and Continue
      </PrimaryButton>
    </div>
  )
}
