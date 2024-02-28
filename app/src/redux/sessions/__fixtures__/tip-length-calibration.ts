import {
  fixtureTiprack300ul,
  fixtureCalibrationBlock,
} from '@opentrons/shared-data'
import type {
  TipLengthCalibrationSessionDetails,
  CalibrationLabware,
} from '../types'
import type { TipLengthCalibrationSessionParams } from '../tip-length-calibration/types'

export const mockTipLengthTipRack: CalibrationLabware = {
  slot: '8',
  loadName: 'opentrons_96_tiprack_300ul',
  namespace: 'opentrons',
  version: 1,
  isTiprack: true,
  definition: fixtureTiprack300ul as CalibrationLabware['definition'],
}

export const mockTipLengthCalBlock: CalibrationLabware = {
  slot: '1',
  loadName: 'opentrons_calibrationblock_short_side_left',
  namespace: 'opentrons',
  version: 1,
  isTiprack: false,
  definition: fixtureCalibrationBlock as CalibrationLabware['definition'],
}

export const mockTipLengthCalibrationSessionDetails: TipLengthCalibrationSessionDetails = {
  instrument: {
    model: 'fake_pipette_model' as any,
    name: 'fake_pipette_name',
    tipLength: 42,
    mount: 'right',
    serial: 'fake serial 2',
    defaultTipracks: [],
  },
  currentStep: 'labwareLoaded',
  labware: [mockTipLengthTipRack, mockTipLengthCalBlock],
  supportedCommands: [],
}

export const mockTipLengthCalibrationSessionParams: TipLengthCalibrationSessionParams = {
  mount: 'left',
  hasCalibrationBlock: true,
  tipRackDefinition: fixtureTiprack300ul as CalibrationLabware['definition'],
}
