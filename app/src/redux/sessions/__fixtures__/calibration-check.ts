import type {
  CheckCalibrationSessionDetails,
  CalibrationCheckComparisonsPerCalibration,
  CalibrationCheckComparisonMap,
  CalibrationCheckComparison,
  CheckCalibrationSessionParams,
  CalibrationLabware,
} from '../types'

import tipRackFixture from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul.json'
import {
  CHECK_STEP_COMPARING_HEIGHT,
  CHECK_STEP_COMPARING_POINT_ONE,
  CHECK_STEP_COMPARING_POINT_THREE,
  CHECK_STEP_COMPARING_POINT_TWO,
  CHECK_STEP_COMPARING_TIP,
} from '../calibration-check/constants'

export const mockCalibrationCheckLabware: CalibrationLabware = {
  slot: '8',
  loadName: 'opentrons_96_tiprack_300ul',
  namespace: 'opentrons',
  version: 1,
  isTiprack: true,
  definition: tipRackFixture as CalibrationLabware['definition'],
}

export const badZComparison: CalibrationCheckComparison = {
  differenceVector: [0, 0, 4],
  thresholdVector: [0, 0, 1],
  exceedsThreshold: true,
}
export const goodZComparison: CalibrationCheckComparison = {
  differenceVector: [0, 0, 0.1],
  thresholdVector: [0, 0, 1],
  exceedsThreshold: false,
}
export const badXYComparison: CalibrationCheckComparison = {
  differenceVector: [4, 4, 0],
  thresholdVector: [1, 1, 0],
  exceedsThreshold: true,
}
export const goodXYComparison: CalibrationCheckComparison = {
  differenceVector: [0.1, 0.1, 0],
  thresholdVector: [1, 1, 0],
  exceedsThreshold: false,
}

export const badTipLengthCalibration: CalibrationCheckComparisonMap = {
  status: 'OUTSIDE_THRESHOLD',
  [CHECK_STEP_COMPARING_TIP]: badZComparison,
} as any
export const badPipetteOffsetCalibration: CalibrationCheckComparisonMap = {
  status: 'OUTSIDE_THRESHOLD',
  [CHECK_STEP_COMPARING_HEIGHT]: badZComparison,
  [CHECK_STEP_COMPARING_POINT_ONE]: badXYComparison,
} as any
export const goodTipLengthCalibration: CalibrationCheckComparisonMap = {
  status: 'IN_THRESHOLD',
  [CHECK_STEP_COMPARING_TIP]: goodZComparison,
} as any
export const goodPipetteOffsetCalibration: CalibrationCheckComparisonMap = {
  status: 'IN_THRESHOLD',
  [CHECK_STEP_COMPARING_HEIGHT]: goodZComparison,
  [CHECK_STEP_COMPARING_POINT_ONE]: goodXYComparison,
} as any
export const goodDeckCalibration: CalibrationCheckComparisonMap = {
  status: 'IN_THRESHOLD',
  [CHECK_STEP_COMPARING_POINT_ONE]: goodXYComparison,
  [CHECK_STEP_COMPARING_POINT_TWO]: goodXYComparison,
  [CHECK_STEP_COMPARING_POINT_THREE]: goodXYComparison,
} as any

export const mockSecondPipetteHealthCheckCalibration: CalibrationCheckComparisonsPerCalibration = {
  tipLength: badTipLengthCalibration,
  pipetteOffset: badPipetteOffsetCalibration,
}
export const mockFirstPipettteHealthCheckPerCalibration: CalibrationCheckComparisonsPerCalibration = {
  tipLength: goodTipLengthCalibration,
  pipetteOffset: goodPipetteOffsetCalibration,
  deck: goodDeckCalibration,
}

export const mockRobotCalibrationCheckSessionDetails: CheckCalibrationSessionDetails = {
  instruments: [
    {
      model: 'fake_pipette_model' as any,
      name: 'fake_pipette_name',
      tipLength: 42,
      mount: 'left',
      rank: 'first',
      serial: 'fake pipette serial 1',
      tipRackLoadName: 'fake_tiprack_load_name',
      tipRackDisplay: 'fake tiprack display name',
      tipRackUri: 'fake tiprack uri',
      defaultTipracks: [],
    },
    {
      model: 'fake_pipette_model' as any,
      name: 'fake_pipette_name',
      tipLength: 42,
      mount: 'right',
      rank: 'second',
      serial: 'fake pipette serial 2',
      tipRackLoadName: 'fake_tiprack_load_name_2',
      tipRackDisplay: 'fake tiprack display name 2',
      tipRackUri: 'fake tiprack uri 2',
      defaultTipracks: [],
    },
  ],
  currentStep: 'sessionStarted',
  comparisonsByPipette: {
    first: mockFirstPipettteHealthCheckPerCalibration,
    second: mockSecondPipetteHealthCheckCalibration,
  },
  labware: [mockCalibrationCheckLabware],
  activePipette: {
    model: 'fake_pipette_model' as any,
    name: 'fake_pipette_name',
    tipLength: 42,
    mount: 'left',
    rank: 'first',
    serial: 'fake pipette serial 1',
    tipRackLoadName: 'fake_tiprack_load_name',
    tipRackDisplay: 'fake tiprack display name',
    tipRackUri: 'fake tiprack uri',
    defaultTipracks: [],
  },
  activeTipRack: mockCalibrationCheckLabware,
}

export const mockRobotCalibrationCheckSessionParams: CheckCalibrationSessionParams = {
  hasCalibrationBlock: true,
  tipRacks: [],
}
