// @flow
// TipProbe controls
import * as React from 'react'

import { CalibrationInfoBox } from '../CalibrationInfoBox'

import { UncalibratedInfo } from './UncalibratedInfo'
import type { CalibrateTipLengthProps } from './types'

const PANEL_BY_STEP: {
  [string]: React.ComponentType<CalibrateTipLengthProps>,
} = {}
export function CalibrateTipLength(props: CalibrateTipLengthProps): React.Node {
  const { mount, probed } = props
  const currentStep = ''
  const title = `${mount} pipette calibration`
  const Panel = PANEL_BY_STEP[currentStep]

  return (
    <>
      <CalibrationInfoBox confirmed={probed} title={title}>
        {Panel ? <Panel {...props} /> : <UncalibratedInfo />}
      </CalibrationInfoBox>
    </>
  )
}
