import { POST, DELETE, GET } from '../../robot-api'
import {
  makeResponseFixtures,
  mockV2ErrorResponse,
} from '../../robot-api/__fixtures__'
import {
  mockRobotCalibrationCheckSessionDetails,
  mockRobotCalibrationCheckSessionParams,
} from './calibration-check'
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
  createParams: mockRobotCalibrationCheckSessionParams,
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
  data: {},
}

export const mockSessionResponse: Types.SessionResponse = {
  data: {
    ...mockCalibrationCheckSessionAttributes,
    id: mockSessionId,
  },
}

export const mockTipLengthCalibrationSessionResponse: Types.SessionResponse = {
  data: {
    ...mockTipLengthCalibrationSessionAttributes,
    id: mockSessionId,
  },
}

export const mockPipetteOffsetCalibrationSessionResponse: Types.SessionResponse = {
  data: {
    ...mockPipetteOffsetCalibrationSessionAttributes,
    id: mockSessionId,
  },
}

export const mockDeckCalibrationSessionResponse: Types.SessionResponse = {
  data: {
    ...mockDeckCalibrationSessionAttributes,
    id: mockSessionId,
  },
}

export const mockMultiSessionResponse: Types.MultiSessionResponse = {
  data: [
    {
      ...mockCalibrationCheckSessionAttributes,
      id: mockSessionId,
    },
    {
      ...mockCalibrationCheckSessionAttributes,
      id: mockOtherSessionId,
    },
  ],
}

export const mockSessionCommandResponse: Types.SessionCommandResponse = {
  data: {
    ...mockSessionCommandAttributes,
    id: mockSessionId,
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
