// @flow
import tipRackFixture from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul'
import type {
  DeckCalibrationSessionDetails,
  DeckCalibrationLabware,
} from '../types'

export const mockDeckCalTipRack: DeckCalibrationLabware = {
  slot: '8',
  loadName: 'opentrons_96_tiprack_300ul',
  namespace: 'opentrons',
  version: 1,
  isTiprack: true,
  definition: tipRackFixture,
}

export const mockDeckCalibrationSessionDetails: DeckCalibrationSessionDetails = {
  instrument: {
    model: 'fake_pipette_model',
    name: 'fake_pipette_name',
    tip_length: 42,
    mount: 'right',
    serial: 'fake serial 1',
  },
  currentStep: 'sessionStarted',
  labware: [mockDeckCalTipRack],
}
