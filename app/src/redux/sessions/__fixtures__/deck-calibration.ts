import tipRackFixture from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import type {
  DeckCalibrationSessionDetails,
  CalibrationLabware,
} from '../types'

export const mockDeckCalTipRack: CalibrationLabware = {
  slot: '8',
  loadName: 'opentrons_96_tiprack_300ul',
  namespace: 'opentrons',
  version: 1,
  isTiprack: true,
  definition: tipRackFixture as CalibrationLabware['definition'],
}

export const mockDeckCalibrationSessionDetails: DeckCalibrationSessionDetails = {
  instrument: {
    model: 'fake_pipette_model' as any,
    name: 'fake_pipette_name',
    tipLength: 42,
    mount: 'right',
    serial: 'fake serial 1',
    defaultTipracks: [],
  },
  currentStep: 'sessionStarted',
  labware: [mockDeckCalTipRack],
  supportedCommands: [],
}
