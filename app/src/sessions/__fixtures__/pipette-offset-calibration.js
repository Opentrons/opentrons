// @flow
import tipRackFixture from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul'
import type { PipetteOffsetCalibrationSessionDetails } from '../types'
import type {
  PipetteOffsetCalibrationSessionParams,
  PipetteOffsetCalibrationLabware,
} from '../pipette-offset-calibration/types'

export const mockPipetteOffsetTipRack: PipetteOffsetCalibrationLabware = {
  slot: '8',
  loadName: 'opentrons_96_tiprack_300ul',
  namespace: 'opentrons',
  version: 1,
  isTiprack: true,
  definition: tipRackFixture,
}

export const mockPipetteOffsetCalibrationSessionDetails: PipetteOffsetCalibrationSessionDetails = {
  instrument: {
    model: 'fake_pipette_model',
    name: 'fake_pipette_name',
    tip_length: 42,
    mount: 'right',
    serial: 'fake serial 2',
  },
  currentStep: 'labwareLoaded',
  labware: [mockPipetteOffsetTipRack],
}

export const mockPipetteOffsetCalibrationSessionParams: PipetteOffsetCalibrationSessionParams = {
  mount: 'left',
}
