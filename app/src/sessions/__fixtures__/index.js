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
  command: 'calibration.check.comparePoint',
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
  leftPipetteModel: mockRobotCalibrationCheckSessionDetails.activePipette.model,
  rightPipetteModel: mockRobotCalibrationCheckSessionDetails.instruments,
  comparingFirstPipetteHeightDifferenceVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingHeight.differenceVector,
  comparingFirstPipetteHeightThresholdVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingHeight.thresholdVector,
  comparingFirstPipetteHeightExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingHeight.exceedsThreshold,
  comparingFirstPipetteHeightErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingHeight.transformType,
  comparingFirstPipettePointOneDifferenceVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointOne.differenceVector,
  comparingFirstPipettePointOneThresholdVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointOne.thresholdVector,
  comparingFirstPipettePointOneExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointOne.exceedsThreshold,
  comparingFirstPipettePointOneErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointOne.transformType,
  comparingFirstPipettePointTwoDifferenceVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointTwo.differenceVector,
  comparingFirstPipettePointTwoThresholdVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointTwo.thresholdVector,
  comparingFirstPipettePointTwoExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointTwo.exceedsThreshold,
  comparingFirstPipettePointTwoErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointTwo.transformType,
  comparingFirstPipettePointThreeDifferenceVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointThree.differenceVector,
  comparingFirstPipettePointThreeThresholdVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointThree.thresholdVector,
  comparingFirstPipettePointThreeExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointThree.exceedsThreshold,
  comparingFirstPipettePointThreeErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointThree.transformType,
  comparingSecondPipetteHeightDifferenceVector:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.second
      .comparingHeight.differenceVector,
}

export const mockCalibrationCheckSessionIntercomProps = {
  sessionType: Constants.SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
  leftPipetteModel: mockRobotCalibrationCheckSessionDetails.activePipette.model,
  rightPipetteModel: mockRobotCalibrationCheckSessionDetails.instruments,
  succeeded: true,
  comparingFirstPipetteHeightExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingHeight.exceedsThreshold,
  comparingFirstPipetteHeightErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingHeight.transformType,
  comparingFirstPipettePointOneExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointOne.exceedsThreshold,
  comparingFirstPipettePointOneErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointOne.transformType,
  comparingFirstPipettePointTwoExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointTwo.exceedsThreshold,
  comparingFirstPipettePointTwoErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointTwo.transformType,
  comparingFirstPipettePointThreeExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointThree.exceedsThreshold,
  comparingFirstPipettePointThreeErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.first
      .comparingPointThree.transformType,
  comparingSecondPipetteHeightExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.second
      .comparingHeight.exceedsThreshold,
  comparingSecondPipetteHeightErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.second
      .comparingHeight.transformType,
  comparingSecondPipettePointOneExceedsThreshold:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.second
      .comparingPointOne.exceedsThreshold,
  comparingSecondPipettePointOneErrorSource:
    mockRobotCalibrationCheckSessionDetails.comparisonsByStep.second
      .comparingPointOne.transformType,
}
