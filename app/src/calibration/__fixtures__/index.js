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

export const mockRobotCalibrationCheckSessionData: RobotCalibrationCheckSessionData = {
  instruments: {
    abc123_pipette_uuid: {
      model: 'fake_pipette_model',
      name: 'fake_pipette_name',
      tip_length: 42,
      mount_axis: 2,
      plunger_axis: 4,
      pipette_id: 'abc123_pipette_uuid',
    },
    def456_pipette_uuid: {
      model: 'fake_pipette_model',
      name: 'fake_pipette_name',
      tip_length: 42,
      mount_axis: 2,
      plunger_axis: 4,
      pipette_id: 'def456_pipette_uuid',
    },
  },
  currentStep: 'sessionStart',
  nextSteps: {
    links: { loadLabware: '/fake/route' },
  },
  labware: [
    {
      alternatives: ['fake_tiprack_load_name'],
      slot: '8',
      id: 'abc123_labware_uuid',
      forPipettes: ['abc123_pipette_uuid'],
      loadName: 'opentrons_96_tiprack_300ul',
      namespace: 'opentrons',
      version: 1,
    },
    {
      alternatives: ['fake_other_tiprack_load_name'],
      slot: '6',
      id: 'def456_labware_uuid',
      forPipettes: ['def456_pipette_uuid'],
      loadName: 'opentrons_96_tiprack_20ul',
      namespace: 'opentrons',
      version: 1,
    },
  ],
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

export const makeUpdateCheckSessionResponseFixtures = (
  pathExtension: string,
) => (
  makeResponseFixtures<
    RobotCalibrationCheckSessionData,
    {| message: string |}
  >({
    method: POST,
    path: `${ROBOT_CALIBRATION_CHECK_PATH}/${pathExtension}`,
    successStatus: 200,
    successBody: mockRobotCalibrationCheckSessionData,
    failureStatus: 500,
    failureBody: mockFailureBody,
  })
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
