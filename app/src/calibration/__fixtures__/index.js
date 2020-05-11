// @flow

import { POST, GET, DELETE } from '../../robot-api'
import {
  makeResponseFixtures,
  mockFailureBody,
  mockRobot,
} from '../../robot-api/__fixtures__'
import { ROBOT_CALIBRATION_CHECK_PATH } from '../constants'
import type { RobotCalibrationCheckSessionData } from '../api-types'

export { mockRobot }

const mockComparison = {
  differenceVector: [0, 0, 0],
  thresholdVector: [1, 1, 1],
  exceedsThreshold: false,
}

export const mockRobotCalibrationCheckSessionData: RobotCalibrationCheckSessionData = {
  instruments: {
    LEFT: {
      model: 'fake_pipette_model',
      name: 'fake_pipette_name',
      tip_length: 42,
      mount: 'left',
      tiprack_id: 'abc123_labware_uuid',
      rank: 'first',
    },
    RIGHT: {
      model: 'fake_pipette_model',
      name: 'fake_pipette_name',
      tip_length: 42,
      mount: 'right',
      tiprack_id: 'def456_labware_uuid',
      rank: 'second',
    },
  },
  currentStep: 'sessionStarted',
  nextSteps: {
    links: { labwareLoaded: '/fake/route' },
  },
  comparisonsByStep: {
    comparingFirstPipetteHeight: mockComparison,
    comparingFirstPipettePointOne: mockComparison,
    comparingFirstPipettePointTwo: mockComparison,
    comparingFirstPipettePointThree: mockComparison,
    comparingSecondPipetteHeight: mockComparison,
    comparingSecondPipettePointOne: mockComparison,
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

export const badZComparison = {
  differenceVector: [0, 0, 4],
  thresholdVector: [0, 0, 1],
  exceedsThreshold: true,
}
export const goodZComparison = {
  differenceVector: [0, 0, 0.1],
  thresholdVector: [0, 0, 1],
  exceedsThreshold: false,
}
export const badXYComparison = {
  differenceVector: [4, 4, 0],
  thresholdVector: [1, 1, 0],
  exceedsThreshold: true,
}
export const goodXYComparison = {
  differenceVector: [0.1, 0.1, 0],
  thresholdVector: [1, 1, 0],
  exceedsThreshold: false,
}

export const {
  successMeta: mockCreateCheckSessionSuccessMeta,
  failureMeta: mockCreateCheckSessionFailureMeta,
  success: mockCreateCheckSessionSuccess,
  failure: mockCreateCheckSessionFailure,
} = makeResponseFixtures<
  RobotCalibrationCheckSessionData,
  {| message: string |}
>({
  method: POST,
  path: ROBOT_CALIBRATION_CHECK_PATH,
  successStatus: 201,
  successBody: mockRobotCalibrationCheckSessionData,
  failureStatus: 500,
  failureBody: mockFailureBody,
})

export const {
  successMeta: mockFetchCheckSessionSuccessMeta,
  failureMeta: mockFetchCheckSessionFailureMeta,
  success: mockFetchCheckSessionSuccess,
  failure: mockFetchCheckSessionFailure,
} = makeResponseFixtures<
  RobotCalibrationCheckSessionData,
  {| message: string |}
>({
  method: GET,
  path: ROBOT_CALIBRATION_CHECK_PATH,
  successStatus: 200,
  successBody: mockRobotCalibrationCheckSessionData,
  failureStatus: 500,
  failureBody: mockFailureBody,
})

export const makeUpdateCheckSessionResponseFixtures = (pathExtension: string) =>
  makeResponseFixtures<RobotCalibrationCheckSessionData, {| message: string |}>(
    {
      method: POST,
      path: `${ROBOT_CALIBRATION_CHECK_PATH}/${pathExtension}`,
      successStatus: 200,
      successBody: mockRobotCalibrationCheckSessionData,
      failureStatus: 500,
      failureBody: mockFailureBody,
    }
  )

export const {
  successMeta: mockDeleteCheckSessionSuccessMeta,
  failureMeta: mockDeleteCheckSessionFailureMeta,
  success: mockDeleteCheckSessionSuccess,
  failure: mockDeleteCheckSessionFailure,
} = makeResponseFixtures<{| message: string |}, {| message: string |}>({
  method: DELETE,
  path: ROBOT_CALIBRATION_CHECK_PATH,
  successStatus: 200,
  successBody: { message: 'Successfully deleted session' },
  failureStatus: 500,
  failureBody: mockFailureBody,
})
