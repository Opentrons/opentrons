// @flow

import { POST, DELETE, GET } from '../../robot-api'
import {
  makeResponseFixtures,
  mockV2ErrorResponse,
} from '../../robot-api/__fixtures__'
import { mockRobotCalibrationCheckSessionDetails } from './calibration-check'
import {
  mockTipLengthCalibrationSessionDetails,
  mockTipLengthCalibrationSessionParams,
} from './tip-length-calibration'
import { mockDeckCalibrationSessionDetails } from './deck-calibration'

import type { ResponseFixtures } from '../../robot-api/__fixtures__'
import type { RobotApiV2ErrorResponseBody } from '../../robot-api/types'

import * as Types from '../types'
import * as Constants from '../constants'

export * from './calibration-check'
export * from './tip-length-calibration'
export * from './deck-calibration'

export const mockSessionId: string = 'fake_session_id'
export const mockOtherSessionId: string = 'other_fake_session_id'

export const mockCalibrationCheckSessionAttributes: Types.CalibrationCheckSessionResponseAttributes = {
  sessionType: Constants.SESSION_TYPE_CALIBRATION_CHECK,
  createParams: {},
  details: mockRobotCalibrationCheckSessionDetails,
}

export const mockTipLengthCalibrationSessionAttributes: Types.TipLengthCalibrationSessionResponseAttributes = {
  sessionType: Constants.SESSION_TYPE_TIP_LENGTH_CALIBRATION,
  createParams: mockTipLengthCalibrationSessionParams,
  details: mockTipLengthCalibrationSessionDetails,
}

export const mockDeckCalibrationSessionAttributes: Types.DeckCalibrationSessionResponseAttributes = {
  sessionType: Constants.SESSION_TYPE_DECK_CALIBRATION,
  createParams: {},
  details: mockDeckCalibrationSessionDetails,
}

export const mockSession: Types.Session = {
  ...mockCalibrationCheckSessionAttributes,
  id: mockSessionId,
}

export const mockSessionCommand: Types.SessionCommandAttributes = {
  command: 'calibration.jog',
  data: { someData: 32 },
}

export const mockSessionCommandAttributes: Types.SessionCommandAttributes = {
  command: 'calibration.check.preparePipette',
  status: 'accepted',
  data: {},
}

export const mockSessionResponse: Types.SessionResponse = {
  data: {
    id: mockSessionId,
    type: 'Session',
    attributes: mockCalibrationCheckSessionAttributes,
  },
}

export const mockMultiSessionResponse: Types.MultiSessionResponse = {
  data: [
    {
      id: mockSessionId,
      type: 'Session',
      attributes: mockCalibrationCheckSessionAttributes,
    },
    {
      id: mockOtherSessionId,
      type: 'Session',
      attributes: mockCalibrationCheckSessionAttributes,
    },
  ],
}

export const mockSessionCommandResponse: Types.SessionCommandResponse = {
  data: {
    id: mockSessionId,
    type: 'SessionCommand',
    attributes: mockSessionCommandAttributes,
  },
}

export const {
  successMeta: mockCreateSessionSuccessMeta,
  failureMeta: mockCreateSessionFailureMeta,
  success: mockCreateSessionSuccess,
  failure: mockCreateSessionFailure,
}: ResponseFixtures<
  Types.SessionResponse,
  RobotApiV2ErrorResponseBody
> = makeResponseFixtures({
  method: POST,
  path: Constants.SESSIONS_PATH,
  successStatus: 201,
  successBody: mockSessionResponse,
  failureStatus: 500,
  failureBody: mockV2ErrorResponse,
})

export const {
  successMeta: mockDeleteSessionSuccessMeta,
  failureMeta: mockDeleteSessionFailureMeta,
  success: mockDeleteSessionSuccess,
  failure: mockDeleteSessionFailure,
}: ResponseFixtures<
  Types.SessionResponse,
  RobotApiV2ErrorResponseBody
> = makeResponseFixtures({
  method: DELETE,
  path: `${Constants.SESSIONS_PATH}/${mockSessionId}`,
  successStatus: 200,
  successBody: mockSessionResponse,
  failureStatus: 500,
  failureBody: mockV2ErrorResponse,
})

export const {
  successMeta: mockFetchSessionSuccessMeta,
  failureMeta: mockFetchSessionFailureMeta,
  success: mockFetchSessionSuccess,
  failure: mockFetchSessionFailure,
}: ResponseFixtures<
  Types.SessionResponse,
  RobotApiV2ErrorResponseBody
> = makeResponseFixtures({
  method: GET,
  path: `${Constants.SESSIONS_PATH}/${mockSessionId}`,
  successStatus: 200,
  successBody: mockSessionResponse,
  failureStatus: 500,
  failureBody: mockV2ErrorResponse,
})

export const {
  successMeta: mockFetchAllSessionsSuccessMeta,
  failureMeta: mockFetchAllSessionsFailureMeta,
  success: mockFetchAllSessionsSuccess,
  failure: mockFetchAllSessionsFailure,
}: ResponseFixtures<
  Types.MultiSessionResponse,
  RobotApiV2ErrorResponseBody
> = makeResponseFixtures({
  method: GET,
  path: Constants.SESSIONS_PATH,
  successStatus: 200,
  successBody: mockMultiSessionResponse,
  failureStatus: 500,
  failureBody: mockV2ErrorResponse,
})

export const {
  successMeta: mockSessionCommandsSuccessMeta,
  failureMeta: mockSessionCommandsFailureMeta,
  success: mockSessionCommandsSuccess,
  failure: mockSessionCommandsFailure,
}: ResponseFixtures<
  Types.SessionCommandResponse,
  RobotApiV2ErrorResponseBody
> = makeResponseFixtures({
  method: GET,
  path: `${Constants.SESSIONS_PATH}/${mockSessionId}/${Constants.SESSIONS_COMMANDS_PATH_EXTENSION}`,
  successStatus: 200,
  successBody: mockSessionCommandResponse,
  failureStatus: 500,
  failureBody: mockV2ErrorResponse,
})

export const mockCalibrationCheckSessionAnalyticsProps = {
  sessionType: Constants.SESSION_TYPE_CALIBRATION_CHECK,
  leftPipetteModel:
    mockRobotCalibrationCheckSessionDetails.instruments.left.model,
  rightPipetteModel:
    mockRobotCalibrationCheckSessionDetails.instruments.right.model,
  comparingFirstPipetteHeightDifferenceVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipetteHeight.differenceVector,
  comparingFirstPipetteHeightThresholdVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipetteHeight.thresholdVector,
  comparingFirstPipetteHeightExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipetteHeight.exceedsThreshold,
  comparingFirstPipetteHeightErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipetteHeight.transformType,
  comparingFirstPipettePointOneDifferenceVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointOne.differenceVector,
  comparingFirstPipettePointOneThresholdVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointOne.thresholdVector,
  comparingFirstPipettePointOneExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointOne.exceedsThreshold,
  comparingFirstPipettePointOneErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointOne.transformType,
  comparingFirstPipettePointTwoDifferenceVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointTwo.differenceVector,
  comparingFirstPipettePointTwoThresholdVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointTwo.thresholdVector,
  comparingFirstPipettePointTwoExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointTwo.exceedsThreshold,
  comparingFirstPipettePointTwoErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointTwo.transformType,
  comparingFirstPipettePointThreeDifferenceVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointThree.differenceVector,
  comparingFirstPipettePointThreeThresholdVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointThree.thresholdVector,
  comparingFirstPipettePointThreeExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointThree.exceedsThreshold,
  comparingFirstPipettePointThreeErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointThree.transformType,
  comparingSecondPipetteHeightDifferenceVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingSecondPipetteHeight.differenceVector,
  comparingSecondPipetteHeightThresholdVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingSecondPipetteHeight.thresholdVector,
  comparingSecondPipetteHeightExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingSecondPipetteHeight.exceedsThreshold,
  comparingSecondPipetteHeightErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingSecondPipetteHeight.transformType,
  comparingSecondPipettePointOneDifferenceVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingSecondPipettePointOne.differenceVector,
  comparingSecondPipettePointOneThresholdVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingSecondPipettePointOne.thresholdVector,
  comparingSecondPipettePointOneExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingSecondPipettePointOne.exceedsThreshold,
  comparingSecondPipettePointOneErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingSecondPipettePointOne.transformType,
}

export const mockCalibrationCheckSessionIntercomProps = {
  sessionType: Constants.SESSION_TYPE_CALIBRATION_CHECK,
  leftPipetteModel:
    mockRobotCalibrationCheckSessionDetails.instruments.left.model,
  rightPipetteModel:
    mockRobotCalibrationCheckSessionDetails.instruments.right.model,
  succeeded: true,
  comparingFirstPipetteHeightExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipetteHeight.exceedsThreshold,
  comparingFirstPipetteHeightErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipetteHeight.transformType,
  comparingFirstPipettePointOneExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointOne.exceedsThreshold,
  comparingFirstPipettePointOneErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointOne.transformType,
  comparingFirstPipettePointTwoExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointTwo.exceedsThreshold,
  comparingFirstPipettePointTwoErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointTwo.transformType,
  comparingFirstPipettePointThreeExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointThree.exceedsThreshold,
  comparingFirstPipettePointThreeErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingFirstPipettePointThree.transformType,
  comparingSecondPipetteHeightExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingSecondPipetteHeight.exceedsThreshold,
  comparingSecondPipetteHeightErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingSecondPipetteHeight.transformType,
  comparingSecondPipettePointOneExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingSecondPipettePointOne.exceedsThreshold,
  comparingSecondPipettePointOneErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingSecondPipettePointOne.transformType,
}
