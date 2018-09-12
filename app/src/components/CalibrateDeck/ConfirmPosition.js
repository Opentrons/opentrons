// @flow
import * as React from 'react'
import type {CalibrateDeckStartedProps} from './types'
import {PrimaryButton} from '@opentrons/components'
import JogControls from '../JogControls'
import Instructions from './Instructions'

type Props = CalibrateDeckStartedProps & {
  proceed: () => mixed,
}

export default function ConfirmPosition (props: Props) {
  return (
    <div>
      {/* $FlowFixMe: `...props` type doesn't include necessary keys */}
      <Instructions {...props} />
      <JogControls jog={props.jog} />
      <PrimaryButton onClick={props.proceed}>
        Save Calibration and Continue
      </PrimaryButton>
    </div>
  )
}
