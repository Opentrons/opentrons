// @flow
import * as React from 'react'
import type {CalibrateDeckProps} from './types'
import {ModalPage, PrimaryButton} from '@opentrons/components'
import JogControls from '../JogControls'
import Instructions from './Instructions'

export default function InstructionsModal (props: CalibrateDeckProps) {
  const HEADING = props.calibrationStep === 'step-2'
   ? 'Calibrate the z-axis'
   : 'Calibrate the X-Y axis'

  return (
    <ModalPage
      titleBar={{
        title: props.title,
        subtitle: props.subtitle,
        back: {
          disabled: true
        }
      }}
      heading= {HEADING}
      >
      <Instructions {...props} />
      <JogControls {...props} />
      <PrimaryButton disabled>
        Save Calibration and Continue
      </PrimaryButton>
    </ModalPage>
  )
}
