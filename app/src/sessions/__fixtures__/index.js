// @flow

import * as Types from '../types'
import * as Constants from '../constants'
import { POST, DELETE, GET } from '../../robot-api'
import {
  makeResponseFixtures,
  mockV2ErrorResponse,
} from '../../robot-api/__fixtures__'

import type {
  RobotApiV2ResponseBody,
  RobotApiV2ErrorResponseBody,
} from '../../robot-api/types'

export const mockRobotSessionData: Types.RobotSessionData = {
  sessionType: 'check',
  sessionId: '1234',
  meta: { someData: 5 },
}

export const mockRobotSessionUpdate: Types.RobotSessionUpdate = {
  commandType: 'dosomething',
  payload: { someData: 32 },
}

export const mockRobotSessionUpdateData: Types.RobotSessionUpdateData = {
  commandId: '4321',
  status: 'accepted',
  meta: {
    sessionType: 'check',
    sessionId: '1234',
    meta: {
      someData: 15,
      someOtherData: 'hi',
    },
  },
}

export const mockRobotSessionResponse: RobotApiV2ResponseBody = {
  data: {
    id: 'session1234',
    type: 'Session',
    attributes: {
      details: {
        someData: 123,
      },
      session_type: 'check',
    },
  },
}

export const mockRobotSessionUpdateResponse: RobotApiV2ResponseBody = {
  data: {
    id: '4321',
    type: 'Command',
    attributes: {
      commandId: '4321',
      status: 'accepted',
    },
    meta: {
      sessionType: 'check',
      sessionId: '1234',
      details: {
        someData: 15,
        someOtherData: 'hi',
      },
    },
  },
}

export const {
  successMeta: mockCreateSessionSuccessMeta,
  failureMeta: mockCreateSessionFailureMeta,
  success: mockCreateSessionSuccess,
  failure: mockCreateSessionFailure,
} = makeResponseFixtures<RobotApiV2ResponseBody, RobotApiV2ErrorResponseBody>({
  method: POST,
  path: Constants.SESSIONS_PATH,
  successStatus: 201,
  successBody: mockRobotSessionResponse,
  failureStatus: 500,
  failureBody: mockV2ErrorResponse,
})

export const {
  successMeta: mockDeleteSessionSuccessMeta,
  failureMeta: mockDeleteSessionFailureMeta,
  success: mockDeleteSessionSuccess,
  failure: mockDeleteSessionFailure,
} = makeResponseFixtures<RobotApiV2ResponseBody, RobotApiV2ErrorResponseBody>({
  method: DELETE,
  path: `${Constants.SESSIONS_PATH}/1234`,
  successStatus: 200,
  successBody: mockRobotSessionResponse,
  failureStatus: 500,
  failureBody: mockV2ErrorResponse,
})

export const {
  successMeta: mockFetchSessionSuccessMeta,
  failureMeta: mockFetchSessionFailureMeta,
  success: mockFetchSessionSuccess,
  failure: mockFetchSessionFailure,
} = makeResponseFixtures<RobotApiV2ResponseBody, RobotApiV2ErrorResponseBody>({
  method: GET,
  path: `${Constants.SESSIONS_PATH}/1234`,
  successStatus: 200,
  successBody: mockRobotSessionResponse,
  failureStatus: 500,
  failureBody: mockV2ErrorResponse,
})

export const {
  successMeta: mockUpdateSessionSuccessMeta,
  failureMeta: mockUpdateSessionFailureMeta,
  success: mockUpdateSessionSuccess,
  failure: mockUpdateSessionFailure,
} = makeResponseFixtures<RobotApiV2ResponseBody, RobotApiV2ErrorResponseBody>({
  method: GET,
  path: `${Constants.SESSIONS_PATH}/1234/${Constants.SESSIONS_UPDATE_PATH_EXTENSION}`,
  successStatus: 200,
  successBody: mockRobotSessionUpdateResponse,
  failureStatus: 500,
  failureBody: mockV2ErrorResponse,
})
