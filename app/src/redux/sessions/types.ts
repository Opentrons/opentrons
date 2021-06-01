import type { LabwareDefinition2 } from '@opentrons/shared-data'

import {
  CREATE_SESSION,
  CREATE_SESSION_SUCCESS,
  CREATE_SESSION_FAILURE,
  DELETE_SESSION,
  DELETE_SESSION_SUCCESS,
  DELETE_SESSION_FAILURE,
  FETCH_SESSION,
  FETCH_SESSION_SUCCESS,
  FETCH_SESSION_FAILURE,
  FETCH_ALL_SESSIONS,
  FETCH_ALL_SESSIONS_SUCCESS,
  FETCH_ALL_SESSIONS_FAILURE,
  ENSURE_SESSION,
  CLEAR_ALL_SESSIONS,
  CREATE_SESSION_COMMAND,
  CREATE_SESSION_COMMAND_SUCCESS,
  CREATE_SESSION_COMMAND_FAILURE,
  SESSION_TYPE_CALIBRATION_HEALTH_CHECK,
  SESSION_TYPE_TIP_LENGTH_CALIBRATION,
  SESSION_TYPE_DECK_CALIBRATION,
  SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION,
} from './constants'

import type {
  RobotApiRequestMeta,
  RobotApiV2ResponseBody,
  RobotApiV2ErrorResponseBody,
} from '../robot-api/types'

import * as CalCheckTypes from './calibration-check/types'
import * as TipLengthCalTypes from './tip-length-calibration/types'
import * as DeckCalTypes from './deck-calibration/types'
import * as PipOffsetCalTypes from './pipette-offset-calibration/types'
import * as CalCheckConstants from './calibration-check/constants'
import * as TipCalConstants from './tip-length-calibration/constants'
import * as DeckCalConstants from './deck-calibration/constants'
import * as PipOffsetCalConstants from './pipette-offset-calibration/constants'
import * as CommonCalConstants from './common-calibration/constants'

export * from './calibration-check/types'
export * from './tip-length-calibration/types'
export * from './deck-calibration/types'
export * from './pipette-offset-calibration/types'

// The available session types
export type SessionType =
  | typeof SESSION_TYPE_CALIBRATION_HEALTH_CHECK
  | typeof SESSION_TYPE_TIP_LENGTH_CALIBRATION
  | typeof SESSION_TYPE_DECK_CALIBRATION
  | typeof SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION

export type SessionParams =
  | {}
  | TipLengthCalTypes.TipLengthCalibrationSessionParams
  | PipOffsetCalTypes.PipetteOffsetCalibrationSessionParams
  | CalCheckTypes.CheckCalibrationSessionParams

type Values<O> = O[keyof O]

export type SessionCommandString =
  | Values<typeof CalCheckConstants.checkCommands>
  | Values<typeof TipCalConstants.tipCalCommands>
  | Values<typeof DeckCalConstants.deckCalCommands>
  | Values<typeof PipOffsetCalConstants.pipOffsetCalCommands>
  | Values<typeof CommonCalConstants.sharedCalCommands>

export type CalibrationSessionStep =
  | CalCheckTypes.RobotCalibrationCheckStep
  | TipLengthCalTypes.TipLengthCalibrationStep
  | DeckCalTypes.DeckCalibrationStep
  | PipOffsetCalTypes.PipetteOffsetCalibrationStep

export type VectorTuple = [number, number, number]

export type SessionCommandData =
  | { vector: VectorTuple }
  | { hasBlock: boolean }
  | { tiprackDefinition: LabwareDefinition2 }
  | {}

export interface SessionCommandParams {
  command: SessionCommandString
  data?: SessionCommandData
}

export interface CalibrationCheckSessionResponseAttributes {
  sessionType: typeof SESSION_TYPE_CALIBRATION_HEALTH_CHECK
  details: CalCheckTypes.CheckCalibrationSessionDetails
  createParams: CalCheckTypes.CheckCalibrationSessionParams
}

export interface TipLengthCalibrationSessionResponseAttributes {
  sessionType: typeof SESSION_TYPE_TIP_LENGTH_CALIBRATION
  details: TipLengthCalTypes.TipLengthCalibrationSessionDetails
  createParams: TipLengthCalTypes.TipLengthCalibrationSessionParams
}

export interface DeckCalibrationSessionResponseAttributes {
  sessionType: typeof SESSION_TYPE_DECK_CALIBRATION
  details: DeckCalTypes.DeckCalibrationSessionDetails
  createParams: {}
}
export interface PipetteOffsetCalibrationSessionResponseAttributes {
  sessionType: typeof SESSION_TYPE_PIPETTE_OFFSET_CALIBRATION
  details: PipOffsetCalTypes.PipetteOffsetCalibrationSessionDetails
  createParams: PipOffsetCalTypes.PipetteOffsetCalibrationSessionParams
}

export type SessionResponseAttributes =
  | CalibrationCheckSessionResponseAttributes
  | TipLengthCalibrationSessionResponseAttributes
  | DeckCalibrationSessionResponseAttributes
  | PipetteOffsetCalibrationSessionResponseAttributes

export interface CalibrationCheckSession
  extends CalibrationCheckSessionResponseAttributes {
  id: string
}

export interface TipLengthCalibrationSession
  extends TipLengthCalibrationSessionResponseAttributes {
  id: string
}

export interface DeckCalibrationSession
  extends DeckCalibrationSessionResponseAttributes {
  id: string
}

export interface PipetteOffsetCalibrationSession
  extends PipetteOffsetCalibrationSessionResponseAttributes {
  id: string
}

export type Session =
  | CalibrationCheckSession
  | TipLengthCalibrationSession
  | DeckCalibrationSession
  | PipetteOffsetCalibrationSession

export interface SessionCommandAttributes {
  command: SessionCommandString
  data: SessionCommandData
}

export type SessionResponseModel = Session

export interface SessionCommandResponseModel extends SessionCommandAttributes {
  id: string
  status?: string
}

export type SessionResponse = RobotApiV2ResponseBody<SessionResponseModel>

export type MultiSessionResponse = RobotApiV2ResponseBody<
  SessionResponseModel[]
>

export type SessionCommandResponse = RobotApiV2ResponseBody<SessionCommandResponseModel>

export interface CreateSessionAction {
  type: typeof CREATE_SESSION
  payload: {
    robotName: string
    sessionType: SessionType
    params: SessionParams
  }
  meta: RobotApiRequestMeta | {}
}

export interface CreateSessionSuccessAction {
  type: typeof CREATE_SESSION_SUCCESS
  payload: { robotName: string } & SessionResponse
  meta: RobotApiRequestMeta
}

export interface CreateSessionFailureAction {
  type: typeof CREATE_SESSION_FAILURE
  payload: { robotName: string; error: RobotApiV2ErrorResponseBody }
  meta: RobotApiRequestMeta
}

export interface DeleteSessionAction {
  type: typeof DELETE_SESSION
  payload: { robotName: string; sessionId: string }
  meta: RobotApiRequestMeta | {}
}

export interface DeleteSessionSuccessAction {
  type: typeof DELETE_SESSION_SUCCESS
  payload: { robotName: string } & SessionResponse
  meta: RobotApiRequestMeta
}

export interface DeleteSessionFailureAction {
  type: typeof DELETE_SESSION_FAILURE
  payload: {
    robotName: string
    sessionId: string
    error: RobotApiV2ErrorResponseBody
  }
  meta: RobotApiRequestMeta
}

export interface FetchSessionAction {
  type: typeof FETCH_SESSION
  payload: { robotName: string; sessionId: string }
  meta: RobotApiRequestMeta | {}
}

export interface FetchSessionSuccessAction {
  type: typeof FETCH_SESSION_SUCCESS
  payload: { robotName: string } & SessionResponse
  meta: RobotApiRequestMeta
}

export interface FetchSessionFailureAction {
  type: typeof FETCH_SESSION_FAILURE
  payload: {
    robotName: string
    sessionId: string
    error: RobotApiV2ErrorResponseBody
  }
  meta: RobotApiRequestMeta
}

export interface FetchAllSessionsAction {
  type: typeof FETCH_ALL_SESSIONS
  payload: { robotName: string }
  meta: RobotApiRequestMeta | {}
}

export interface FetchAllSessionsSuccessAction {
  type: typeof FETCH_ALL_SESSIONS_SUCCESS
  payload: {
    robotName: string
    readonly sessions: SessionResponseModel[]
  }
  meta: RobotApiRequestMeta
}

export interface FetchAllSessionsFailureAction {
  type: typeof FETCH_ALL_SESSIONS_FAILURE
  payload: { robotName: string; error: RobotApiV2ErrorResponseBody }
  meta: RobotApiRequestMeta
}

export interface EnsureSessionAction {
  type: typeof ENSURE_SESSION
  payload: {
    robotName: string
    sessionType: SessionType
    params: SessionParams
  }
  meta: RobotApiRequestMeta | {}
}

export interface CreateSessionCommandAction {
  type: typeof CREATE_SESSION_COMMAND
  payload: {
    robotName: string
    sessionId: string
    command: SessionCommandAttributes
  }
  meta: RobotApiRequestMeta | {}
}

export interface CreateSessionCommandSuccessAction {
  type: typeof CREATE_SESSION_COMMAND_SUCCESS
  payload: {
    robotName: string
    sessionId: string
  } & SessionResponse
  meta: RobotApiRequestMeta
}

export interface CreateSessionCommandFailureAction {
  type: typeof CREATE_SESSION_COMMAND_FAILURE
  payload: {
    robotName: string
    sessionId: string
    error: RobotApiV2ErrorResponseBody
  }
  meta: RobotApiRequestMeta
}

export interface ClearAllSessionsAction {
  type: typeof CLEAR_ALL_SESSIONS
  payload: { robotName: string }
}

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
  | FetchAllSessionsAction
  | FetchAllSessionsSuccessAction
  | FetchAllSessionsFailureAction
  | CreateSessionCommandAction
  | CreateSessionCommandSuccessAction
  | CreateSessionCommandFailureAction
  | EnsureSessionAction
  | ClearAllSessionsAction

export interface SessionsById {
  [id: string]: Session
}

export type PerRobotSessionState = Partial<{
  readonly robotSessions: SessionsById | null
}>

export type SessionState = Partial<{
  readonly [robotName: string]: undefined | PerRobotSessionState
}>

export interface CalibrationLabware {
  slot: string
  loadName: string
  namespace: string
  version: number
  isTiprack: boolean
  definition: LabwareDefinition2
}
