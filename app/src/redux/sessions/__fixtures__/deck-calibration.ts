import { fixtureTiprack300ul } from '@opentrons/shared-data'

import { calibrationSlotFromSlotName } from '../utils'

import type {
  CalibrationLabware,
  DeckCalibrationSessionDetails,
} from '../types'

export const mockDeckCalTipRack: CalibrationLabware = {
  slot: calibrationSlotFromSlotName('8'),
  loadName: 'opentrons_96_tiprack_300ul',
  namespace: 'opentrons',
  version: 1,
  isTiprack: true,
  definition: fixtureTiprack300ul as CalibrationLabware['definition'],
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
