// @flow
import {
  CHECK_STEP_COMPARING_HEIGHT,
  CHECK_STEP_COMPARING_POINT_ONE,
  CHECK_STEP_COMPARING_POINT_TWO,
  CHECK_STEP_COMPARING_POINT_THREE,
  CHECK_TRANSFORM_TYPE_UNKNOWN,
} from '../constants'

import type {
  CheckCalibrationHealthSessionDetails,
  CalibrationHealthCheckComparison,
  CalibrationLabware,
} from '../types'

import tipRackFixture from '@opentrons/shared-data/labware/fixtures/2/fixture_tiprack_300_ul'

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
  transformType: CHECK_TRANSFORM_TYPE_UNKNOWN,
}
export const goodZComparison: CalibrationHealthCheckComparison = {
  differenceVector: [0, 0, 0.1],
  thresholdVector: [0, 0, 1],
  exceedsThreshold: false,
  transformType: CHECK_TRANSFORM_TYPE_UNKNOWN,
}
export const badXYComparison: CalibrationHealthCheckComparison = {
  differenceVector: [4, 4, 0],
  thresholdVector: [1, 1, 0],
  exceedsThreshold: true,
  transformType: CHECK_TRANSFORM_TYPE_UNKNOWN,
}
export const goodXYComparison: CalibrationHealthCheckComparison = {
  differenceVector: [0.1, 0.1, 0],
  thresholdVector: [1, 1, 0],
  exceedsThreshold: false,
  transformType: CHECK_TRANSFORM_TYPE_UNKNOWN,
}

export const mockRobotCalibrationCheckSessionDetails: CheckCalibrationHealthSessionDetails = {
  instruments: [
    {
      model: 'fake_pipette_model',
      name: 'fake_pipette_name',
      tip_length: 42,
      mount: 'left',
      rank: 'second',
      serial: 'fake pipette serial 1',
    },
    {
      model: 'fake_pipette_model',
      name: 'fake_pipette_name',
      tip_length: 42,
      mount: 'right',
      rank: 'first',
      serial: 'fake pipette serial 2',
    },
  ],
  currentStep: 'sessionStarted',
  comparisonsByPipette: {
    first: {
      [CHECK_STEP_COMPARING_HEIGHT]: goodZComparison,
      [CHECK_STEP_COMPARING_POINT_ONE]: goodXYComparison,
      [CHECK_STEP_COMPARING_POINT_TWO]: goodXYComparison,
      [CHECK_STEP_COMPARING_POINT_THREE]: goodXYComparison,
    },
    second: {
      [CHECK_STEP_COMPARING_HEIGHT]: goodZComparison,
      [CHECK_STEP_COMPARING_POINT_ONE]: goodXYComparison,
      [CHECK_STEP_COMPARING_POINT_TWO]: goodXYComparison,
      [CHECK_STEP_COMPARING_POINT_THREE]: goodXYComparison,
    },
  },
  labware: [mockCalibrationCheckLabware],
  activePipette: {
    model: 'fake_pipette_model',
    name: 'fake_pipette_name',
    tip_length: 42,
    mount: 'left',
    rank: 'second',
    serial: 'fake pipette serial 1',
  },
  activeTipRack: mockCalibrationCheckLabware,
}
