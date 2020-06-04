// @flow
// TipProbe controls
import * as React from 'react'

import { CalibrationInfoBox } from '../CalibrationInfoBox'

import { UncalibratedInfo } from './UncalibratedInfo'
import { Introduction } from './Introduction'
import { DeckSetup } from './DeckSetup'
import { MeasureNozzle } from './MeasureNozzle'
import { TipPickUp } from './TipPickUp'
import { InspectingTip } from './InspectingTip'
import { MeasureTip } from './MeasureTip'
import { CompleteConfirmation } from './CompleteConfirmation'

import type { CalibrateTipLengthProps } from './types'

const PANEL_BY_STEP: {
  [string]: React.ComponentType<CalibrateTipLengthProps>,
} = {
  sessionStarted: Introduction,
  labwareLoaded: DeckSetup,
  measuringNozzleOffset: MeasureNozzle,
  preparingPipette: TipPickUp,
  inspectingTip: InspectingTip,
  measuringTipOffset: MeasureTip,
  calibrationComplete: CompleteConfirmation,
}
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
