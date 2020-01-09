// @flow
// robot actions and action types
import { _NAME as NAME } from './constants'

import type { Error } from '../types'
import type { ProtocolData } from '../protocol/types'
import type { Mount, Slot, Axis, Direction, SessionUpdate } from './types'

// TODO(mc, 2017-11-22): rename this function to actionType
const makeRobotActionName = action => `${NAME}:${action}`
const tagForRobotApi = action => ({ ...action, meta: { robotCommand: true } })

export type ConnectAction = {|
  type: 'robot:CONNECT',
  payload: {|
    name: string,
  |},
  meta: {|
    robotCommand: true,
  |},
|}

export type ConnectResponseAction = {|
  type: 'robot:CONNECT_RESPONSE',
  payload: {|
    error: ?{ message: string },
    sessionCapabilities: Array<string>,
  |},
|}

export type ReturnTipAction = {|
  type: 'robot:RETURN_TIP',
  payload: {|
    mount: Mount,
  |},
  meta: {|
    robotCommand: true,
  |},
|}

export type ReturnTipResponseAction = {|
  type: 'robot:RETURN_TIP_RESPONSE',
  payload: {|
    error: ?{ message: string },
  |},
|}

export type ClearConnectResponseAction = {|
  type: 'robot:CLEAR_CONNECT_RESPONSE',
|}

export type DisconnectAction = {|
  type: 'robot:DISCONNECT',
  meta: {|
    robotCommand: true,
  |},
|}

export type DisconnectResponseAction = {|
  type: 'robot:DISCONNECT_RESPONSE',
  payload: {},
|}

export type UnexpectedDisconnectAction = {|
  type: 'robot:UNEXPECTED_DISCONNECT',
|}

export type ConfirmProbedAction = {|
  type: 'robot:CONFIRM_PROBED',
  payload: Mount,
  meta: {|
    robotCommand: true,
  |},
|}

export type PipetteCalibrationAction = {|
  type: 'robot:JOG',
  payload: {|
    mount: Mount,
    axis?: Axis,
    direction?: Direction,
    step?: number,
  |},
  meta: {|
    robotCommand: true,
  |},
|}

export type SetJogDistanceAction = {|
  type: 'robot:SET_JOG_DISTANCE',
  payload: number,
|}

export type LabwareCalibrationAction = {|
  type:
    | 'robot:MOVE_TO'
    | 'robot:PICKUP_AND_HOME'
    | 'robot:DROP_TIP_AND_HOME'
    | 'robot:CONFIRM_TIPRACK'
    | 'robot:UPDATE_OFFSET'
    | 'robot:SET_JOG_DISTANCE',
  payload: {|
    mount: Mount,
    slot: Slot,
  |},
  meta: {|
    robotCommand: true,
  |},
|}

export type CalibrationSuccessAction = {|
  type:
    | 'robot:MOVE_TO_SUCCESS'
    | 'robot:JOG_SUCCESS'
    | 'robot:PICKUP_AND_HOME_SUCCESS'
    | 'robot:DROP_TIP_AND_HOME_SUCCESS'
    | 'robot:CONFIRM_TIPRACK_SUCCESS'
    | 'robot:UPDATE_OFFSET_SUCCESS'
    | 'robot:RETURN_TIP_SUCCESS',
  payload: {
    isTiprack?: boolean,
    tipOn?: boolean,
  },
|}

export type CalibrationFailureAction = {|
  type:
    | 'robot:MOVE_TO_FAILURE'
    | 'robot:JOG_FAILURE'
    | 'robot:PICKUP_AND_HOME_FAILURE'
    | 'robot:DROP_TIP_AND_HOME_FAILURE'
    | 'robot:CONFIRM_TIPRACK_FAILURE'
    | 'robot:UPDATE_OFFSET_FAILURE'
    | 'robot:RETURN_TIP_FAILURE',
  error: true,
  payload: Error,
|}

export type SessionResponseAction = {|
  type: 'robot:SESSION_RESPONSE',
  // TODO(mc, 2018-09-06): this payload is incomplete
  payload: {|
    name: string,
    protocolText: string,
    metadata?: ?$PropertyType<ProtocolData, 'metadata'>,
    apiLevel: [number, number],
  |},
  meta: {| freshUpload: boolean |},
|}

export type SessionErrorAction = {|
  type: 'robot:SESSION_ERROR',
  payload: {| error: Error |},
  meta: {| freshUpload: boolean |},
|}

export type SessionUpdateAction = {|
  type: 'robot:SESSION_UPDATE',
  payload: SessionUpdate,
  meta: {| now: number |},
|}

export type RefreshSessionAction = {|
  type: 'robot:REFRESH_SESSION',
  meta: {|
    robotCommand: true,
  |},
|}

export type CalibrationResponseAction =
  | CalibrationSuccessAction
  | CalibrationFailureAction

export type SetModulesReviewedAction = {|
  type: 'robot:SET_MODULES_REVIEWED',
  payload: boolean,
|}

export type ClearCalibrationRequestAction = {|
  type: 'robot:CLEAR_CALIBRATION_REQUEST',
|}

// TODO(mc, 2018-01-23): refactor to use type above
//   DO NOT ADD NEW ACTIONS HERE
export const actionTypes = {
  // calibration
  SET_DECK_POPULATED: makeRobotActionName('SET_DECK_POPULATED'),
  // TODO(mc, 2018-01-10): rename MOVE_TO_FRONT to PREPARE_TO_PROBE?
  MOVE_TO_FRONT: makeRobotActionName('MOVE_TO_FRONT'),
  MOVE_TO_FRONT_RESPONSE: makeRobotActionName('MOVE_TO_FRONT_RESPONSE'),
  PROBE_TIP: makeRobotActionName('PROBE_TIP'),
  PROBE_TIP_RESPONSE: makeRobotActionName('PROBE_TIP_RESPONSE'),

  RETURN_TIP: makeRobotActionName('RETURN_TIP'),
  RETURN_TIP_RESPONSE: makeRobotActionName('RETURN_TIP_RESPONSE'),
  CONFIRM_LABWARE: makeRobotActionName('CONFIRM_LABWARE'),

  // protocol run controls
  RUN: makeRobotActionName('RUN'),
  RUN_RESPONSE: makeRobotActionName('RUN_RESPONSE'),
  PAUSE: makeRobotActionName('PAUSE'),
  PAUSE_RESPONSE: makeRobotActionName('PAUSE_RESPONSE'),
  RESUME: makeRobotActionName('RESUME'),
  RESUME_RESPONSE: makeRobotActionName('RESUME_RESPONSE'),
  CANCEL: makeRobotActionName('CANCEL'),
  CANCEL_RESPONSE: makeRobotActionName('CANCEL_RESPONSE'),

  TICK_RUN_TIME: makeRobotActionName('TICK_RUN_TIME'),
}

// TODO(mc, 2018-01-23): NEW ACTION TYPES GO HERE
export type Action =
  | ConnectAction
  | ConnectResponseAction
  | DisconnectAction
  | DisconnectResponseAction
  | ClearConnectResponseAction
  | UnexpectedDisconnectAction
  | ConfirmProbedAction
  | PipetteCalibrationAction
  | LabwareCalibrationAction
  | CalibrationResponseAction
  | CalibrationFailureAction
  | ReturnTipAction
  | ReturnTipResponseAction
  | SetJogDistanceAction
  | SessionResponseAction
  | SessionErrorAction
  | SessionUpdateAction
  | RefreshSessionAction
  | SetModulesReviewedAction
  | ClearCalibrationRequestAction

export const actions = {
  connect(name: string): ConnectAction {
    return {
      type: 'robot:CONNECT',
      payload: { name },
      meta: { robotCommand: true },
    }
  },

  connectResponse(
    error: Error | null,
    sessionCapabilities: Array<string> = []
  ): ConnectResponseAction {
    return {
      type: 'robot:CONNECT_RESPONSE',
      payload: { error, sessionCapabilities },
    }
  },

  clearConnectResponse(): ClearConnectResponseAction {
    return { type: 'robot:CLEAR_CONNECT_RESPONSE' }
  },

  disconnect(): DisconnectAction {
    return { type: 'robot:DISCONNECT', meta: { robotCommand: true } }
  },

  disconnectResponse(): DisconnectResponseAction {
    return {
      type: 'robot:DISCONNECT_RESPONSE',
      payload: {},
    }
  },

  unexpectedDisconnect(): UnexpectedDisconnectAction {
    return { type: 'robot:UNEXPECTED_DISCONNECT' }
  },

  sessionResponse(
    error: ?Error,
    // TODO(mc, 2018-01-23): type Session (see reducers/session.js)
    session: any,
    freshUpload: boolean
  ): SessionResponseAction | SessionErrorAction {
    const meta = { freshUpload }

    if (error) {
      return { type: 'robot:SESSION_ERROR', payload: { error }, meta }
    }

    return { type: 'robot:SESSION_RESPONSE', payload: session, meta }
  },

  sessionUpdate(update: SessionUpdate, now: number): SessionUpdateAction {
    return {
      type: 'robot:SESSION_UPDATE',
      payload: update,
      meta: { now },
    }
  },

  setModulesReviewed(payload: boolean) {
    return { type: 'robot:SET_MODULES_REVIEWED', payload }
  },

  setDeckPopulated(payload: boolean) {
    return { type: actionTypes.SET_DECK_POPULATED, payload }
  },

  // pick up a tip with instrument on `mount` from tiprack in `slot`
  pickupAndHome(mount: Mount, slot: Slot): LabwareCalibrationAction {
    return {
      type: 'robot:PICKUP_AND_HOME',
      payload: { mount, slot },
      meta: { robotCommand: true },
    }
  },

  // response for pickup and home
  pickupAndHomeResponse(error: ?Error = null): CalibrationResponseAction {
    if (error) {
      return {
        type: 'robot:PICKUP_AND_HOME_FAILURE',
        error: true,
        payload: error,
      }
    }

    return {
      type: 'robot:PICKUP_AND_HOME_SUCCESS',
      payload: {},
    }
  },

  // drop the tip on pipette on `mount` into the tiprack in `slot`
  dropTipAndHome(mount: Mount, slot: Slot): LabwareCalibrationAction {
    return {
      type: 'robot:DROP_TIP_AND_HOME',
      payload: { mount, slot },
      meta: { robotCommand: true },
    }
  },

  // response for drop tip and home
  dropTipAndHomeResponse(error: ?Error = null): CalibrationResponseAction {
    if (error) {
      return {
        type: 'robot:DROP_TIP_AND_HOME_FAILURE',
        error: true,
        payload: error,
      }
    }

    return {
      type: 'robot:DROP_TIP_AND_HOME_SUCCESS',
      payload: {},
    }
  },

  // set tiprack to calibrated and conditionally drop the tip
  confirmTiprack(mount: Mount, slot: Slot): LabwareCalibrationAction {
    return {
      type: 'robot:CONFIRM_TIPRACK',
      payload: { mount, slot },
      meta: { robotCommand: true },
    }
  },

  // response for pickup and home
  // payload.tipOn is a flag for whether a tip remains on the pipette
  confirmTiprackResponse(
    error: ?Error = null,
    tipOn: boolean = false
  ): CalibrationResponseAction {
    if (error) {
      return {
        type: 'robot:CONFIRM_TIPRACK_FAILURE',
        error: true,
        payload: error,
      }
    }

    return {
      type: 'robot:CONFIRM_TIPRACK_SUCCESS',
      payload: { tipOn },
    }
  },

  moveToFront(mount: Mount) {
    return tagForRobotApi({
      type: actionTypes.MOVE_TO_FRONT,
      payload: { mount },
    })
  },

  moveToFrontResponse(error: ?Error = null) {
    const action: { type: string, error: boolean, payload?: Error } = {
      type: actionTypes.MOVE_TO_FRONT_RESPONSE,
      error: error != null,
    }
    if (error) action.payload = error

    return action
  },

  probeTip(mount: Mount) {
    return tagForRobotApi({ type: actionTypes.PROBE_TIP, payload: { mount } })
  },

  probeTipResponse(error: ?Error = null) {
    const action: { type: string, error: boolean, payload?: Error } = {
      type: actionTypes.PROBE_TIP_RESPONSE,
      error: error != null,
    }
    if (error) action.payload = error

    return action
  },

  // confirm tip removed + tip probed then home pipette on `mount`
  confirmProbed(mount: Mount): ConfirmProbedAction {
    return {
      type: 'robot:CONFIRM_PROBED',
      payload: mount,
      meta: { robotCommand: true },
    }
  },

  returnTip(mount: Mount) {
    return tagForRobotApi({ type: actionTypes.RETURN_TIP, payload: { mount } })
  },

  returnTipResponse(error: ?Error = null) {
    const action: { type: string, error: boolean, payload?: Error } = {
      type: actionTypes.RETURN_TIP_RESPONSE,
      error: error != null,
    }
    if (error) action.payload = error

    return action
  },

  moveTo(mount: Mount, slot: Slot): LabwareCalibrationAction {
    return {
      type: 'robot:MOVE_TO',
      payload: { mount, slot },
      meta: { robotCommand: true },
    }
  },

  moveToResponse(error: ?Error = null): CalibrationResponseAction {
    if (error) {
      return {
        type: 'robot:MOVE_TO_FAILURE',
        error: true,
        payload: error,
      }
    }

    return { type: 'robot:MOVE_TO_SUCCESS', payload: {} }
  },

  setJogDistance(step: number): SetJogDistanceAction {
    return { type: 'robot:SET_JOG_DISTANCE', payload: step }
  },

  jog(
    mount: Mount,
    axis: Axis,
    direction: Direction,
    step: number
  ): PipetteCalibrationAction {
    return {
      type: 'robot:JOG',
      payload: { mount, axis, direction, step },
      meta: { robotCommand: true },
    }
  },

  jogResponse(error: ?Error = null): CalibrationResponseAction {
    if (error) {
      return {
        type: 'robot:JOG_FAILURE',
        error: true,
        payload: error,
      }
    }

    return { type: 'robot:JOG_SUCCESS', payload: {} }
  },

  // update the offset of labware in slot using position of pipette on mount
  updateOffset(mount: Mount, slot: Slot): LabwareCalibrationAction {
    return {
      type: 'robot:UPDATE_OFFSET',
      payload: { mount, slot },
      meta: { robotCommand: true },
    }
  },

  // response for updateOffset
  updateOffsetResponse(error: ?Error = null): CalibrationResponseAction {
    if (error) {
      return {
        type: 'robot:UPDATE_OFFSET_FAILURE',
        error: true,
        payload: error,
      }
    }

    return {
      type: 'robot:UPDATE_OFFSET_SUCCESS',
      payload: {},
    }
  },

  confirmLabware(labware: Slot) {
    return { type: actionTypes.CONFIRM_LABWARE, payload: { labware } }
  },

  run() {
    return tagForRobotApi({ type: actionTypes.RUN })
  },

  runResponse(error: ?Error = null) {
    const action: { type: string, error: boolean, payload?: Error } = {
      type: actionTypes.RUN_RESPONSE,
      error: error != null,
    }
    if (error) action.payload = error

    return action
  },

  pause() {
    return tagForRobotApi({ type: actionTypes.PAUSE })
  },

  pauseResponse(error: ?Error = null) {
    const action: { type: string, error: boolean, payload?: Error } = {
      type: actionTypes.PAUSE_RESPONSE,
      error: error != null,
    }
    if (error) action.payload = error

    return action
  },

  resume() {
    return tagForRobotApi({ type: actionTypes.RESUME })
  },

  resumeResponse(error: ?Error = null) {
    const action: { type: string, error: boolean, payload?: Error } = {
      type: actionTypes.RESUME_RESPONSE,
      error: error != null,
    }
    if (error) action.payload = error

    return action
  },

  cancel() {
    return tagForRobotApi({ type: actionTypes.CANCEL })
  },

  cancelResponse(error: ?Error = null) {
    const action: { type: string, error: boolean, payload?: Error } = {
      type: actionTypes.CANCEL_RESPONSE,
      error: error != null,
    }
    if (error) action.payload = error

    return action
  },

  refreshSession(): RefreshSessionAction {
    return { type: 'robot:REFRESH_SESSION', meta: { robotCommand: true } }
  },

  tickRunTime() {
    return { type: actionTypes.TICK_RUN_TIME }
  },

  clearCalibrationRequest(): ClearCalibrationRequestAction {
    return { type: 'robot:CLEAR_CALIBRATION_REQUEST' }
  },
}
