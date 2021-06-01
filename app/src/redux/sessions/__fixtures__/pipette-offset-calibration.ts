import tipRackFixture from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import type {
  PipetteOffsetCalibrationSessionDetails,
  CalibrationLabware,
} from '../types'
import type { PipetteOffsetCalibrationSessionParams } from '../pipette-offset-calibration/types'

export const mockPipetteOffsetTipRack: CalibrationLabware = {
  slot: '8',
  loadName: 'opentrons_96_tiprack_300ul',
  namespace: 'opentrons',
  version: 1,
  isTiprack: true,
  definition: tipRackFixture as CalibrationLabware['definition'],
}

export const mockPipetteOffsetCalibrationSessionDetails: PipetteOffsetCalibrationSessionDetails = {
  instrument: {
    model: 'fake_pipette_model' as any,
    name: 'fake_pipette_name',
    tipLength: 42,
    mount: 'right',
    serial: 'fake serial 2',
    defaultTipracks: [],
  },
  currentStep: 'labwareLoaded',
  labware: [mockPipetteOffsetTipRack],
  shouldPerformTipLength: false,
  supportedCommands: [],
}

export const mockPipetteOffsetCalibrationSessionParams: PipetteOffsetCalibrationSessionParams = {
  mount: 'left',
  shouldRecalibrateTipLength: true,
  tipRackDefinition: null,
  hasCalibrationBlock: true,
}
