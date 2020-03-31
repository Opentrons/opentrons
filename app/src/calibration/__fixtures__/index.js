// @flow

import { POST, DELETE } from '../../robot-api'
import {
  makeResponseFixtures,
  mockFailureBody,
  mockRobot
} from '../../robot-api/__fixtures__'
import { ROBOT_CALIBRATION_CHECK_PATH } from '../constants'
import type { RobotCalibrationCheckSessionData } from '../api-types'

export { mockRobot }

export const mockRobotCalibrationCheckSessionData = {
  instruments: {},
  currentStep: 'sessionStart',
  nextSteps: {
    links: { specifyLabware: '/fake/route' },
  },
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
 successStatus: 200,
 successBody: mockRobotCalibrationCheckSessionData,
 failureStatus: 500,
 failureBody: mockFailureBody,
})

export const {
  successMeta: mockDeleteCheckSessionSuccessMeta,
  failureMeta: mockDeleteCheckSessionFailureMeta,
  success: mockDeleteCheckSessionSuccess,
  failure: mockDeleteCheckSessionFailure,
} = makeResponseFixtures<
  {| message: string |},
  {| message: string |}
>({
 method: DELETE,
 path: ROBOT_CALIBRATION_CHECK_PATH,
 successStatus: 200,
 successBody: { message: 'Successfully deleted session' },
 failureStatus: 500,
 failureBody: mockFailureBody,
})
