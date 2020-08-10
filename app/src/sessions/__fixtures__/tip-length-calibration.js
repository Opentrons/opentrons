// @flow
import tipRackFixture from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul'
import calBlockFixture from '@opentrons/shared-data/labware/definitions/2/opentrons_calibrationblock_short_side_left/1'
import type { TipLengthCalibrationSessionDetails } from '../types'
import type {
  TipLengthCalibrationSessionParams,
  TipLengthCalibrationLabware,
} from '../tip-length-calibration/types'

export const mockTipLengthTipRack: TipLengthCalibrationLabware = {
  slot: '8',
  loadName: 'opentrons_96_tiprack_300ul',
  namespace: 'opentrons',
  version: 1,
  isTiprack: true,
  definition: tipRackFixture,
}

export const mockTipLengthCalBlock: TipLengthCalibrationLabware = {
  slot: '1',
  loadName: 'opentrons_calibrationblock_short_side_left',
  namespace: 'opentrons',
  version: 1,
  isTiprack: false,
  definition: calBlockFixture,
}

export const mockTipLengthCalibrationSessionDetails: TipLengthCalibrationSessionDetails = {
  instrument: {
    model: 'fake_pipette_model',
    name: 'fake_pipette_name',
    tip_length: 42,
    mount: 'right',
    serial: 'fake serial 2',
  },
  currentStep: 'labwareLoaded',
  labware: [mockTipLengthTipRack, mockTipLengthCalBlock],
}

export const mockTipLengthCalibrationSessionParams: TipLengthCalibrationSessionParams = {
  mount: 'left',
  hasCalibrationBlock: true,
  tipRackDefinition: tipRackFixture,
}
