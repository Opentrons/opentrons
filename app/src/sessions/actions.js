// @flow

import * as Types from './types'
import * as Constants from './constants'
import type {
  RobotApiRequestMeta,
  RobotApiV2ErrorResponseBody,
} from '../robot-api/types'

export const createSession = (
  robotName: string,
  sessionType: Types.SessionType
): Types.CreateSessionAction => ({
  type: Constants.CREATE_SESSION,
  payload: { robotName, sessionType },
  meta: {},
})

export const createSessionSuccess = (
  robotName: string,
  body: Types.SessionResponse,
  meta: RobotApiRequestMeta
): Types.CreateSessionSuccessAction => ({
  type: Constants.CREATE_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: meta,
})

export const createSessionFailure = (
  robotName: string,
  error: RobotApiV2ErrorResponseBody,
  meta: RobotApiRequestMeta
): Types.CreateSessionFailureAction => ({
  type: Constants.CREATE_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const deleteSession = (
  robotName: string,
  sessionId: string
): Types.DeleteSessionAction => ({
  type: Constants.DELETE_SESSION,
  payload: { robotName, sessionId },
  meta: {},
})

export const deleteSessionSuccess = (
  robotName: string,
  body: Types.SessionResponse,
  meta: RobotApiRequestMeta
): Types.DeleteSessionSuccessAction => ({
  type: Constants.DELETE_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: meta,
})

export const deleteSessionFailure = (
  robotName: string,
  error: RobotApiV2ErrorResponseBody,
  meta: RobotApiRequestMeta
): Types.DeleteSessionFailureAction => ({
  type: Constants.DELETE_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const fetchSession = (
  robotName: string,
  sessionId: string
): Types.FetchSessionAction => ({
  type: Constants.FETCH_SESSION,
  payload: { robotName, sessionId },
  meta: {},
})

export const fetchSessionSuccess = (
  robotName: string,
  body: Types.SessionResponse,
  meta: RobotApiRequestMeta
): Types.FetchSessionSuccessAction => ({
  type: Constants.FETCH_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: meta,
})

export const fetchSessionFailure = (
  robotName: string,
  error: RobotApiV2ErrorResponseBody,
  meta: RobotApiRequestMeta
): Types.FetchSessionFailureAction => ({
  type: Constants.FETCH_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const createSessionCommand = (
  robotName: string,
  sessionId: string,
  command: Types.SessionCommand
): Types.CreateSessionCommandAction => ({
  type: Constants.CREATE_SESSION_COMMAND,
  payload: { robotName, sessionId, command },
  meta: {},
})

export const createSessionCommandSuccess = (
  robotName: string,
  sessionId: string,
  body: Types.SessionCommandResponse,
  meta: RobotApiRequestMeta
): Types.CreateSessionCommandSuccessAction => ({
  type: Constants.CREATE_SESSION_COMMAND_SUCCESS,
  payload: { robotName, sessionId, ...body },
  meta: meta,
})

export const createSessionCommandFailure = (
  robotName: string,
  sessionId: string,
  error: RobotApiV2ErrorResponseBody,
  meta: RobotApiRequestMeta
): Types.CreateSessionCommandFailureAction => ({
  type: Constants.CREATE_SESSION_COMMAND_FAILURE,
  payload: { robotName, sessionId, error },
  meta: meta,
})
