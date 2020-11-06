// @flow
import type {
  CheckCalibrationHealthSessionDetails,
  CalibrationHealthCheckComparisonsPerCalibration,
  CalibrationHealthCheckComparisonMap,
  CalibrationHealthCheckComparison,
  CheckCalibrationHealthSessionParams,
  CalibrationLabware,
} from '../types'

import tipRackFixture from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul'
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
  definition: tipRackFixture,
}

export const badZComparison: CalibrationHealthCheckComparison = {
  differenceVector: [0, 0, 4],
  thresholdVector: [0, 0, 1],
  exceedsThreshold: true,
}
export const goodZComparison: CalibrationHealthCheckComparison = {
  differenceVector: [0, 0, 0.1],
  thresholdVector: [0, 0, 1],
  exceedsThreshold: false,
}
export const badXYComparison: CalibrationHealthCheckComparison = {
  differenceVector: [4, 4, 0],
  thresholdVector: [1, 1, 0],
  exceedsThreshold: true,
}
export const goodXYComparison: CalibrationHealthCheckComparison = {
  differenceVector: [0.1, 0.1, 0],
  thresholdVector: [1, 1, 0],
  exceedsThreshold: false,
}

export const badTipLengthCalibration: CalibrationHealthCheckComparisonMap = {
  status: 'OUTSIDE_THRESHOLD',
  [CHECK_STEP_COMPARING_TIP]: badZComparison,
}
export const badPipetteOffsetCalibration: CalibrationHealthCheckComparisonMap = {
  status: 'OUTSIDE_THRESHOLD',
  [CHECK_STEP_COMPARING_HEIGHT]: badZComparison,
  [CHECK_STEP_COMPARING_POINT_ONE]: badXYComparison,
}
export const goodTipLengthCalibration: CalibrationHealthCheckComparisonMap = {
  status: 'IN_THRESHOLD',
  [CHECK_STEP_COMPARING_TIP]: goodZComparison,
}
export const goodPipetteOffsetCalibration: CalibrationHealthCheckComparisonMap = {
  status: 'IN_THRESHOLD',
  [CHECK_STEP_COMPARING_HEIGHT]: goodZComparison,
  [CHECK_STEP_COMPARING_POINT_ONE]: goodXYComparison,
}
export const goodDeckCalibration: CalibrationHealthCheckComparisonMap = {
  status: 'IN_THRESHOLD',
  [CHECK_STEP_COMPARING_POINT_ONE]: goodXYComparison,
  [CHECK_STEP_COMPARING_POINT_TWO]: goodXYComparison,
  [CHECK_STEP_COMPARING_POINT_THREE]: goodXYComparison,
}

export const mockSecondPipetteHealthCheckCalibration: CalibrationHealthCheckComparisonsPerCalibration = {
  tipLength: badTipLengthCalibration,
  pipetteOffset: badPipetteOffsetCalibration,
}
export const mockFirstPipettteHealthCheckPerCalibration: CalibrationHealthCheckComparisonsPerCalibration = {
  tipLength: goodTipLengthCalibration,
  pipetteOffset: goodPipetteOffsetCalibration,
  deck: goodDeckCalibration,
}

export const mockRobotCalibrationCheckSessionDetails: CheckCalibrationHealthSessionDetails = {
  instruments: [
    {
      model: 'fake_pipette_model',
      name: 'fake_pipette_name',
      tip_length: 42,
      mount: 'left',
      rank: 'first',
      serial: 'fake pipette serial 1',
      tipRackLoadName: 'fake_tiprack_load_name',
      tipRackDisplay: 'fake tiprack display name',
      tipRackUri: 'fake tiprack uri',
    },
    {
      model: 'fake_pipette_model',
      name: 'fake_pipette_name',
      tip_length: 42,
      mount: 'right',
      rank: 'second',
      serial: 'fake pipette serial 2',
      tipRackLoadName: 'fake_tiprack_load_name_2',
      tipRackDisplay: 'fake tiprack display name 2',
      tipRackUri: 'fake tiprack uri 2',
    },
  ],
  currentStep: 'sessionStarted',
  comparisonsByPipette: {
    first: mockFirstPipettteHealthCheckPerCalibration,
    second: mockSecondPipetteHealthCheckCalibration,
  },
  labware: [mockCalibrationCheckLabware],
  activePipette: {
    model: 'fake_pipette_model',
    name: 'fake_pipette_name',
    tip_length: 42,
    mount: 'left',
    rank: 'first',
    serial: 'fake pipette serial 1',
    tipRackLoadName: 'fake_tiprack_load_name',
    tipRackDisplay: 'fake tiprack display name',
    tipRackUri: 'fake tiprack uri',
  },
  activeTipRack: mockCalibrationCheckLabware,
}

export const mockRobotCalibrationCheckSessionParams: CheckCalibrationHealthSessionParams = {
  hasCalibrationBlock: true,
  tipRacks: [],
}
