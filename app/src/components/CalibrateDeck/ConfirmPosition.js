// @flow
import * as React from 'react'

import { PrimaryButton } from '@opentrons/components'
import { JogControls } from '../JogControls'
import { Instructions } from './Instructions'

import type { CalibrateDeckStartedProps } from './types'

export type ConfirmPositionProps = {|
  ...CalibrateDeckStartedProps,
  proceed: () => mixed,
|}

export function ConfirmPosition(props: ConfirmPositionProps) {
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
