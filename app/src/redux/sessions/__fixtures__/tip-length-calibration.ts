import { fixtureTiprack300ul } from '@opentrons/shared-data'
// import calBlockFixture from '@opentrons/shared-data/labware/definitions/2/opentrons_calibrationblock_short_side_left/1.json'
import { getLatestLabwareDef } from '../../../assets/labware/getLabware'
import type {
  TipLengthCalibrationSessionDetails,
  CalibrationLabware,
} from '../types'
import type { TipLengthCalibrationSessionParams } from '../tip-length-calibration/types'

const calBlockFixture = getLatestLabwareDef(
  'opentrons_calibrationblock_short_side_left'
)

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
  definition: calBlockFixture as CalibrationLabware['definition'],
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
