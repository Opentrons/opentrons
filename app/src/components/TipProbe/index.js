// @flow
// TipProbe container
import * as React from 'react'
import {connect} from 'react-redux'

import {
  selectors as robotSelectors,
  type InstrumentCalibrationStatus,
  type Mount,
  type Channels
} from '../../robot'

import {UNCHECKED, CHECKED} from '@opentrons/components'
import CalibrationInfoBox from '../CalibrationInfoBox'
import UnprobedPanel from './UnprobedPanel'
import InstrumentMovingPanel from './InstrumentMovingPanel'
import AttachTipPanel from './AttachTipPanel'
import RemoveTipPanel from './RemoveTipPanel'
import ContinuePanel from './ContinuePanel'

type OwnProps = {
  mount: Mount,
  confirmTipProbeUrl: string,
}

type StateProps = {
  calibration: InstrumentCalibrationStatus,
  channels: Channels,
  volume: number,
  probed: boolean,
}

type TipProbeProps = OwnProps & StateProps

const PANEL_BY_CALIBRATION: {
  [InstrumentCalibrationStatus]: React.ComponentType<TipProbeProps>
} = {
  'unprobed': UnprobedPanel,
  'preparing-to-probe': InstrumentMovingPanel,
  'ready-to-probe': AttachTipPanel,
  'probing': InstrumentMovingPanel,
  'probed-tip-on': RemoveTipPanel,
  'probed': ContinuePanel
}

export default connect(mapStateToProps)(TipProbe)

function mapStateToProps (state, ownProps: OwnProps): StateProps {
  const instruments = robotSelectors.getInstruments(state)
  const currentInstrument = instruments
    .find((inst) => inst.mount === ownProps.mount)

  // TODO(mc, 2018-01-22): this should never happen; refactor so this
  //   check isn't necessary
  if (!currentInstrument || !currentInstrument.calibration) {
    throw new Error('no currentInstrument or has no calibration status')
  }

  return currentInstrument
}

function TipProbe (props: TipProbeProps) {
  const {mount, probed, calibration} = props
  const title = `${mount} pipette setup`
  const iconName = probed
    ? CHECKED
    : UNCHECKED

  const Panel = PANEL_BY_CALIBRATION[calibration]

  return (
    <CalibrationInfoBox iconName={iconName} title={title}>
      <Panel {...props} />
    </CalibrationInfoBox>
  )
}
