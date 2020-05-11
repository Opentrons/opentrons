// @flow

import * as Types from './types'
import * as Constants from './constants'

export const createRobotSession = (
  robotName: string,
  sessionType: Types.SessionType
): Types.CreateRobotSessionAction => ({
  type: Constants.CREATE_ROBOT_SESSION,
  payload: { robotName, sessionType },
  meta: {},
})

export const createRobotSessionSuccess = (
  robotName: string,
  body: RobotSessionData,
  meta: RobotApiRequestMeta
): Types.CreateRobotSessionSuccessAction => ({
  type: Constants.CREATE_ROBOT_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: meta,
})

export const createRobotSessionFailure = (
  robotName: string,
  error: RobotApiV2ErrorResponseBody,
  meta: RobotApiRequestMeta
): Types.CreateRobotSessionFailureAction => ({
  type: Constants.CREATE_ROBOT_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const deleteRobotSession = (
  robotName: string,
  sessionId: string
): Types.DeleteRobotSessionAction => ({
  type: Constants.DELETE_ROBOT_SESSION,
  payload: { robotName, sessionId },
  meta: {},
})

export const deleteRobotSessionSuccess = (
  robotName: string,
  body: RobotSessionData,
  meta: RobotApiRequestMeta
): Types.DeleteRobotSessionSuccessAction => ({
  type: Constants.DELETE_ROBOT_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: meta,
})

export const deleteRobotSessionFailure = (
  robotName: string,
  error: RobotApiV2ErrorResponseBody,
  meta: RobotApiRequestMeta
): Types.DeleteRobotSessionFailureAction => ({
  type: Constants.DELETE_ROBOT_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const fetchRobotSession = (
  robotName: string,
  sessionId: string
): Types.FetchRobotSessionAction => ({
  type: Constants.FETCH_ROBOT_SESSION,
  payload: { robotName, sessionId },
  meta: {},
})

export const fetchRobotSessionSuccess = (
  robotName: string,
  body: RobotSessionData,
  meta: RobotApiRequestMeta
): Types.FetchRobotSessionSuccessAction => ({
  type: Constants.FETCH_ROBOT_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: meta,
})

export const fetchRobotSessionFailure = (
  robotName: string,
  error: RobotApiV2ErrorResponseBody,
  meta: RobotApiRequestMeta
): Types.FetchRobotSessionFailureAction => ({
  type: Constants.FETCH_ROBOT_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})

export const updateRobotSession = (
  robotName: string,
  sessionId: string,
  update: Types.RobotSessionUpdate
): Types.UpdateRobotSessionAction => ({
  type: Constants.UPDATE_ROBOT_SESSION,
  payload: { robotName, sessionId, update },
  meta: {},
})

export const updateRobotSessionSuccess = (
  robotName: string,
  body: Types.RobotSessionUpdateData,
  meta: RobotApiRequestMeta
): Types.UpdateRobotSessionSuccessAction => ({
  type: Constants.UPDATE_ROBOT_SESSION_SUCCESS,
  payload: { robotName, ...body },
  meta: meta,
})

export const updateRobotSessionFailure = (
  robotName: string,
  error: RobotApiV2ErrorResponseBody,
  meta: RobotApiRequestMeta
): Types.UpdateRobotSessionFailureAction => ({
  type: Constants.UPDATE_ROBOT_SESSION_FAILURE,
  payload: { robotName, error },
  meta: meta,
})
