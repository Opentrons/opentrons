// @flow
import { PrimaryButton } from '@opentrons/components'
import * as React from 'react'

import { JogControls } from '../JogControls'
import { Instructions } from './Instructions'
import type { CalibrateDeckStartedProps } from './types'

export type ConfirmPositionProps = {|
  ...CalibrateDeckStartedProps,
  proceed: () => mixed,
|}

export function ConfirmPosition(props: ConfirmPositionProps): React.Node {
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
