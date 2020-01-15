// @flow
import * as React from 'react'
import type { CalibrateDeckStartedProps } from './types'
import { PrimaryButton } from '@opentrons/components'
import JogControls from '../JogControls'
import Instructions from './Instructions'

type Props = {|
  ...CalibrateDeckStartedProps,
  proceed: () => mixed,
|}

export default function ConfirmPosition(props: Props) {
  return (
    <div>
      <Instructions calibrationStep={props.calibrationStep} />
      <JogControls jog={props.jog} />
      <PrimaryButton onClick={props.proceed}>
        Save Calibration and Continue
      </PrimaryButton>
    </div>
  )
}
