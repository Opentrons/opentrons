// @flow

import typeof {
  CREATE_SESSION,
  CREATE_SESSION_SUCCESS,
  CREATE_SESSION_FAILURE,
  DELETE_SESSION,
  DELETE_SESSION_SUCCESS,
  DELETE_SESSION_FAILURE,
  FETCH_SESSION,
  FETCH_SESSION_SUCCESS,
  FETCH_SESSION_FAILURE,
  CREATE_SESSION_COMMAND,
  CREATE_SESSION_COMMAND_SUCCESS,
  CREATE_SESSION_COMMAND_FAILURE,
  SESSION_TYPE_CALIBRATION_CHECK,
} from './constants'

import type {
  RobotApiRequestMeta,
  RobotApiV2ResponseBody,
  RobotApiV2ErrorResponseBody,
} from '../robot-api/types'
import * as Calibration from '../calibration'

// The available session types
export type SessionType = SESSION_TYPE_CALIBRATION_CHECK

// The details associated with available session types
type SessionDetails = Calibration.RobotCalibrationCheckSessionDetails
export type SessionCommandString = $Values<typeof Calibration.checkCommands>

// TODO(al, 2020-05-11): data should be properly typed with all
// known command types
export type SessionCommandData = { ... }

export type SessionCommandRequest = {|
  command: SessionCommandString,
  data: SessionCommandData,
|}

export type Session = {|
  sessionType: SessionType,
  details: SessionDetails,
|}

export type SessionCommand = {|
  command: SessionCommandString,
  data: SessionCommandData,
  status?: string,
|}

export type SessionResponseModel = {|
  id: string,
  type: 'Session',
  attributes: Session,
|}

export type SessionCommandResponseModel = {|
  id: string,
  type: 'SessionCommand',
  attributes: SessionCommand,
|}

export type SessionResponse = RobotApiV2ResponseBody<SessionResponseModel, {||}>

export type SessionCommandResponse = RobotApiV2ResponseBody<
  SessionCommandResponseModel,
  Session
>

export type CreateSessionAction = {|
  type: CREATE_SESSION,
  payload: {| robotName: string, sessionType: SessionType |},
  meta: RobotApiRequestMeta,
|}

export type CreateSessionSuccessAction = {|
  type: CREATE_SESSION_SUCCESS,
  payload: {| robotName: string, ...SessionResponse |},
  meta: RobotApiRequestMeta,
|}

export type CreateSessionFailureAction = {|
  type: CREATE_SESSION_FAILURE,
  payload: {| robotName: string, error: RobotApiV2ErrorResponseBody |},
  meta: RobotApiRequestMeta,
|}

export type DeleteSessionAction = {|
  type: DELETE_SESSION,
  payload: {| robotName: string, sessionId: string |},
  meta: RobotApiRequestMeta,
|}

export type DeleteSessionSuccessAction = {|
  type: DELETE_SESSION_SUCCESS,
  payload: {| robotName: string, ...SessionResponse |},
  meta: RobotApiRequestMeta,
|}

export type DeleteSessionFailureAction = {|
  type: DELETE_SESSION_FAILURE,
  payload: {| robotName: string, error: RobotApiV2ErrorResponseBody |},
  meta: RobotApiRequestMeta,
|}

export type FetchSessionAction = {|
  type: FETCH_SESSION,
  payload: {| robotName: string, sessionId: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchSessionSuccessAction = {|
  type: FETCH_SESSION_SUCCESS,
  payload: {| robotName: string, ...SessionResponse |},
  meta: RobotApiRequestMeta,
|}

export type FetchSessionFailureAction = {|
  type: FETCH_SESSION_FAILURE,
  payload: {| robotName: string, error: RobotApiV2ErrorResponseBody |},
  meta: RobotApiRequestMeta,
|}

export type CreateSessionCommandAction = {|
  type: CREATE_SESSION_COMMAND,
  payload: {|
    robotName: string,
    sessionId: string,
    command: SessionCommand,
  |},
  meta: RobotApiRequestMeta,
|}

export type CreateSessionCommandSuccessAction = {|
  type: CREATE_SESSION_COMMAND_SUCCESS,
  payload: {|
    robotName: string,
    sessionId: string,
    ...SessionCommandResponse,
  |},
  meta: RobotApiRequestMeta,
|}

export type CreateSessionCommandFailureAction = {|
  type: CREATE_SESSION_COMMAND_FAILURE,
  payload: {|
    robotName: string,
    sessionId: string,
    error: RobotApiV2ErrorResponseBody,
  |},
  meta: RobotApiRequestMeta,
|}

export type SessionsAction =
  | CreateSessionAction
  | CreateSessionSuccessAction
  | CreateSessionFailureAction
  | DeleteSessionAction
  | DeleteSessionSuccessAction
  | DeleteSessionFailureAction
  | FetchSessionAction
  | FetchSessionSuccessAction
  | FetchSessionFailureAction
  | CreateSessionCommandAction
  | CreateSessionCommandSuccessAction
  | CreateSessionCommandFailureAction

export type SessionsById = $Shape<{|
  [id: string]: Session,
|}>

export type PerRobotSessionState = $Shape<
  $ReadOnly<{|
    robotSessions: SessionsById | null,
  |}>
>

export type SessionState = $Shape<
  $ReadOnly<{|
    [robotName: string]: void | PerRobotSessionState,
  |}>
>
