// @flow
// TipProbe controls
import * as React from 'react'

import type {Instrument, InstrumentCalibrationStatus} from '../../robot'

import CalibrationInfoBox from '../CalibrationInfoBox'
import UnprobedPanel from './UnprobedPanel'
import InstrumentMovingPanel from './InstrumentMovingPanel'
import AttachTipPanel from './AttachTipPanel'
import RemoveTipPanel from './RemoveTipPanel'
import ContinuePanel from './ContinuePanel'

type Props = Instrument & {
  confirmTipProbeUrl: string
}

const PANEL_BY_CALIBRATION: {
  [InstrumentCalibrationStatus]: React.ComponentType<Props>
} = {
  'unprobed': UnprobedPanel,
  'preparing-to-probe': InstrumentMovingPanel,
  'ready-to-probe': AttachTipPanel,
  'probing': InstrumentMovingPanel,
  'probed-tip-on': RemoveTipPanel,
  'probed': ContinuePanel
}

export default function TipProbe (props: Props) {
  const {mount, probed, calibration} = props
  const title = `${mount} pipette calibration`

  const Panel = PANEL_BY_CALIBRATION[calibration]

  return (
    <CalibrationInfoBox confirmed={probed} title={title}>
      <Panel {...props} />
    </CalibrationInfoBox>
  )
}
