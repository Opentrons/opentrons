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
import {
  mockPipetteOffsetCalibrationSessionDetails,
  mockPipetteOffsetCalibrationSessionParams,
} from './pipette-offset-calibration'

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
  sessionType: Constants.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
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

export const mockPipetteOffsetCalibrationSessionAttributes: Types.PipetteOffsetCalibrationSessionResponseAttributes = {
  sessionType: Constants.SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
  createParams: mockPipetteOffsetCalibrationSessionParams,
  details: mockPipetteOffsetCalibrationSessionDetails,
}

export const mockSession: Types.Session = {
  ...mockCalibrationCheckSessionAttributes,
  id: mockSessionId,
}

export const mockSessionCommand: Types.SessionCommandAttributes = {
  command: 'calibration.jog',
  data: { vector: [32, 0, 0] },
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

export const mockTipLengthCalibrationSessionResponse: Types.SessionResponse = {
  data: {
    id: mockSessionId,
    type: 'Session',
    attributes: mockTipLengthCalibrationSessionAttributes,
  },
}

export const mockPipetteOffsetCalibrationSessionResponse: Types.SessionResponse = {
  data: {
    id: mockSessionId,
    type: 'Session',
    attributes: mockPipetteOffsetCalibrationSessionAttributes,
  },
}

export const mockDeckCalibrationSessionResponse: Types.SessionResponse = {
  data: {
    id: mockSessionId,
    type: 'Session',
    attributes: mockDeckCalibrationSessionAttributes,
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
  successMeta: mockDeleteTipLengthCalibrationSessionSuccessMeta,
  failureMeta: mockDeleteTipLengthCalibrationSessionFailureMeta,
  success: mockDeleteTipLengthCalibrationSessionSuccess,
  failure: mockDeleteTipLengthCalibrationSessionFailure,
}: ResponseFixtures<
  Types.SessionResponse,
  RobotApiV2ErrorResponseBody
> = makeResponseFixtures({
  method: DELETE,
  path: `${Constants.SESSIONS_PATH}/${mockSessionId}`,
  successStatus: 200,
  successBody: mockTipLengthCalibrationSessionResponse,
  failureStatus: 500,
  failureBody: mockV2ErrorResponse,
})

export const {
  successMeta: mockDeletePipetteOffsetCalibrationSessionSuccessMeta,
  failureMeta: mockDeletePipetteOffsetCalibrationSessionFailureMeta,
  success: mockDeletePipetteOffsetCalibrationSessionSuccess,
  failure: mockDeletePipetteOffsetCalibrationSessionFailure,
}: ResponseFixtures<
  Types.SessionResponse,
  RobotApiV2ErrorResponseBody
> = makeResponseFixtures({
  method: DELETE,
  path: `${Constants.SESSIONS_PATH}/${mockSessionId}`,
  successStatus: 200,
  successBody: mockPipetteOffsetCalibrationSessionResponse,
  failureStatus: 500,
  failureBody: mockV2ErrorResponse,
})

export const {
  successMeta: mockDeleteDeckCalibrationSessionSuccessMeta,
  failureMeta: mockDeleteDeckCalibrationSessionFailureMeta,
  success: mockDeleteDeckCalibrationSessionSuccess,
  failure: mockDeleteDeckCalibrationSessionFailure,
}: ResponseFixtures<
  Types.SessionResponse,
  RobotApiV2ErrorResponseBody
> = makeResponseFixtures({
  method: DELETE,
  path: `${Constants.SESSIONS_PATH}/${mockSessionId}`,
  successStatus: 200,
  successBody: mockDeckCalibrationSessionResponse,
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
  sessionType: Constants.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
  leftPipetteModel:
    mockRobotCalibrationCheckSessionDetails.instruments[0].model,
  rightPipetteModel:
    mockRobotCalibrationCheckSessionDetails.instruments[1].model,
  comparingFirstPipetteHeightDifferenceVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.comparingHeight
      .differenceVector,
  comparingFirstPipetteHeightThresholdVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.comparingHeight
      .thresholdVector,
  comparingFirstPipetteHeightExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.comparingHeight
      .exceedsThreshold,
  comparingFirstPipetteHeightErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.comparingHeight
      .transformType,
  comparingFirstPipettePointOneDifferenceVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.comparingPointOne
      .differenceVector,
  comparingFirstPipettePointOneThresholdVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.comparingPointOne
      .thresholdVector,
  comparingFirstPipettePointOneExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.comparingPointOne
      .exceedsThreshold,
  comparingFirstPipettePointOneErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.comparingPointOne
      .transformType,
  comparingFirstPipettePointTwoDifferenceVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.comparingPointTwo
      .differenceVector,
  comparingFirstPipettePointTwoThresholdVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.comparingPointTwo
      .thresholdVector,
  comparingFirstPipettePointTwoExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.comparingPointTwo
      .exceedsThreshold,
  comparingFirstPipettePointTwoErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.comparingPointTwo
      .transformType,
  comparingFirstPipettePointThreeDifferenceVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingPointThree.differenceVector,
  comparingFirstPipettePointThreeThresholdVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingPointThree.thresholdVector,
  comparingFirstPipettePointThreeExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingPointThree.exceedsThreshold,
  comparingFirstPipettePointThreeErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingPointThree.transformType,
  comparingSecondPipetteHeightDifferenceVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep
      .comparingSecondPipetteHeight.differenceVector,
}

export const mockCalibrationCheckSessionIntercomProps = {
  sessionType: Constants.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
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
