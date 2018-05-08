// @flow
import * as React from 'react'
import type {CalibrateDeckStartedProps} from './types'
import {PrimaryButton} from '@opentrons/components'
import JogControls from '../JogControls'
import Instructions from './Instructions'

type Props = CalibrateDeckStartedProps & {
  proceed: () => mixed
}

export default function ConfirmPosition (props: Props) {
  return (
    <div>
      <Instructions {...props} />
      <JogControls
        jog={props.jog}
        step={props.jogStep}
        onStepSelect={props.onJogStepSelect}
      />
      <PrimaryButton onClick={props.proceed}>
        Save Calibration and Continue
      </PrimaryButton>
    </div>
  )
}
