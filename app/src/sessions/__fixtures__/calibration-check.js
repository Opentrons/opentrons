// @flow
import {
  CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT,
  CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE,
  CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO,
  CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE,
  CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT,
  CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE,
  CHECK_TRANSFORM_TYPE_UNKNOWN,
} from '../constants'

import type {
  RobotCalibrationCheckSessionDetails,
  RobotCalibrationCheckComparison,
} from '../types'

export const badZComparison: RobotCalibrationCheckComparison = {
  differenceVector: [0, 0, 4],
  thresholdVector: [0, 0, 1],
  exceedsThreshold: true,
  transformType: CHECK_TRANSFORM_TYPE_UNKNOWN,
}
export const goodZComparison: RobotCalibrationCheckComparison = {
  differenceVector: [0, 0, 0.1],
  thresholdVector: [0, 0, 1],
  exceedsThreshold: false,
  transformType: CHECK_TRANSFORM_TYPE_UNKNOWN,
}
export const badXYComparison: RobotCalibrationCheckComparison = {
  differenceVector: [4, 4, 0],
  thresholdVector: [1, 1, 0],
  exceedsThreshold: true,
  transformType: CHECK_TRANSFORM_TYPE_UNKNOWN,
}
export const goodXYComparison: RobotCalibrationCheckComparison = {
  differenceVector: [0.1, 0.1, 0],
  thresholdVector: [1, 1, 0],
  exceedsThreshold: false,
  transformType: CHECK_TRANSFORM_TYPE_UNKNOWN,
}

export const mockRobotCalibrationCheckSessionDetails: RobotCalibrationCheckSessionDetails = {
  instruments: {
    left: {
      model: 'fake_pipette_model',
      name: 'fake_pipette_name',
      tip_length: 42,
      mount: 'left',
      tiprack_id: 'abc123_labware_uuid',
      rank: 'second',
      serial: 'fake pipette serial 1',
    },
    right: {
      model: 'fake_pipette_model',
      name: 'fake_pipette_name',
      tip_length: 42,
      mount: 'right',
      tiprack_id: 'def456_labware_uuid',
      rank: 'first',
      serial: 'fake pipette serial 2',
    },
  },
  currentStep: 'sessionStarted',
  nextSteps: {
    links: { labwareLoaded: '/fake/route' },
  },
  comparisonsByStep: {
    [CHECK_STEP_COMPARING_FIRST_PIPETTE_HEIGHT]: goodZComparison,
    [CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_ONE]: goodXYComparison,
    [CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_TWO]: goodXYComparison,
    [CHECK_STEP_COMPARING_FIRST_PIPETTE_POINT_THREE]: goodXYComparison,
    [CHECK_STEP_COMPARING_SECOND_PIPETTE_HEIGHT]: goodZComparison,
    [CHECK_STEP_COMPARING_SECOND_PIPETTE_POINT_ONE]: goodXYComparison,
  },
  labware: [
    {
      alternatives: ['fake_tiprack_load_name'],
      slot: '8',
      id: 'abc123_labware_uuid',
      forMounts: ['left'],
      loadName: 'opentrons_96_tiprack_300ul',
      namespace: 'opentrons',
      version: 1,
    },
    {
      alternatives: ['fake_other_tiprack_load_name'],
      slot: '6',
      id: 'def456_labware_uuid',
      forMounts: ['right'],
      loadName: 'opentrons_96_tiprack_20ul',
      namespace: 'opentrons',
      version: 1,
    },
  ],
}
