// @flow
// robot actions and action types
// action helpers
import {makeActionName} from '../util'
import {tagAction as tagForAnalytics} from '../analytics'
import {_NAME as NAME} from './constants'
import type {
  Mount,
  Slot,
  Axis,
  Direction,
  RobotService,
  ProtocolFile
} from './types'

// TODO(mc, 2017-11-22): rename this function to actionType
const makeRobotActionName = (action) => makeActionName(NAME, action)
const tagForRobotApi = (action) => ({...action, meta: {robotCommand: true}})

type Error = {message: string}

export type ConfirmProbedAction = {
  type: 'robot:CONFIRM_PROBED',
  payload: Mount
}

export type LabwareCalibrationAction = {
  type:
    | 'robot:PICKUP_AND_HOME'
    | 'robot:DROP_TIP_AND_HOME'
    | 'robot:CONFIRM_TIPRACK'
    | 'robot:UPDATE_OFFSET'
  ,
  payload: {mount: Mount, slot: Slot},
  meta: {robotCommand: true}
}

// TODO(mc, 2018-01-29): split success and failure action types
//   union types for payload make things difficult
export type CalibrationResponseAction = {
  type:
    | 'robot:PICKUP_AND_HOME_RESPONSE'
    | 'robot:DROP_TIP_AND_HOME_RESPONSE'
    | 'robot:CONFIRM_TIPRACK_RESPONSE'
    | 'robot:UPDATE_OFFSET_RESPONSE',
  error: boolean,
  payload: Error | {
    isTiprack?: boolean,
    tipOn?: boolean
  }
}

// TODO(mc, 2018-01-23): refactor to use type above
//   DO NOT ADD NEW ACTIONS HERE
export const actionTypes = {
  // discovery, connect, and disconnect
  DISCOVER: makeRobotActionName('DISCOVER'),
  DISCOVER_FINISH: makeRobotActionName('DISCOVER_FINISH'),
  ADD_DISCOVERED: makeRobotActionName('ADD_DISCOVERED'),
  REMOVE_DISCOVERED: makeRobotActionName('REMOVE_DISCOVERED'),
  CONNECT: makeRobotActionName('CONNECT'),
  CONNECT_RESPONSE: makeRobotActionName('CONNECT_RESPONSE'),
  DISCONNECT: makeRobotActionName('DISCONNECT'),
  DISCONNECT_RESPONSE: makeRobotActionName('DISCONNECT_RESPONSE'),

  // protocol loading
  SESSION: makeRobotActionName('SESSION'),
  SESSION_RESPONSE: makeRobotActionName('SESSION_RESPONSE'),

  // calibration
  SET_DECK_POPULATED: makeRobotActionName('SET_DECK_POPULATED'),
  SET_CURRENT_LABWARE: makeRobotActionName('SET_CURRENT_LABWARE'),
  SET_CURRENT_INSTRUMENT: makeRobotActionName('SET_CURRENT_INSTRUMENT'),
  // TODO(mc, 2018-01-10): rename MOVE_TO_FRONT to PREPARE_TO_PROBE?
  MOVE_TO_FRONT: makeRobotActionName('MOVE_TO_FRONT'),
  MOVE_TO_FRONT_RESPONSE: makeRobotActionName('MOVE_TO_FRONT_RESPONSE'),
  PROBE_TIP: makeRobotActionName('PROBE_TIP'),
  PROBE_TIP_RESPONSE: makeRobotActionName('PROBE_TIP_RESPONSE'),
  MOVE_TO: makeRobotActionName('MOVE_TO'),
  MOVE_TO_RESPONSE: makeRobotActionName('MOVE_TO_RESPONSE'),
  TOGGLE_JOG_DISTANCE: makeRobotActionName('TOGGLE_JOG_DISTANCE'),
  JOG: makeRobotActionName('JOG'),
  JOG_RESPONSE: makeRobotActionName('JOG_RESPONSE'),
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

  TICK_RUN_TIME: makeRobotActionName('TICK_RUN_TIME')
}

// TODO(mc, 2018-01-23): NEW ACTION TYPES GO HERE
export type Action =
  | ConfirmProbedAction
  | LabwareCalibrationAction
  | CalibrationResponseAction

export const actions = {
  discover () {
    return tagForRobotApi({type: actionTypes.DISCOVER})
  },

  discoverFinish () {
    return {type: actionTypes.DISCOVER_FINISH}
  },

  connect (name: string) {
    return tagForRobotApi({type: actionTypes.CONNECT, payload: {name}})
  },

  connectResponse (error: ?Error) {
    const didError = error != null
    const action = {type: actionTypes.CONNECT_RESPONSE, error: didError}

    if (didError) return {...action, payload: error}

    return tagForAnalytics(action)
  },

  disconnect () {
    return tagForRobotApi({type: actionTypes.DISCONNECT})
  },

  disconnectResponse (error: ?Error) {
    const action: {type: string, error: boolean, payload?: Error} = {
      type: actionTypes.DISCONNECT_RESPONSE,
      error: error != null
    }

    if (error) action.payload = error

    return action
  },

  // TODO(mc, 2018-01-23): type RobotService
  addDiscovered (service: RobotService) {
    return {type: actionTypes.ADD_DISCOVERED, payload: service}
  },

  removeDiscovered (name: string) {
    return {type: actionTypes.REMOVE_DISCOVERED, payload: {name}}
  },

  // make new session with protocol file
  session (file: ProtocolFile) {
    return tagForRobotApi({type: actionTypes.SESSION, payload: {file}})
  },

  // TODO(mc, 2018-01-23): type Session (see reducers/session.js)
  sessionResponse (error: ?Error, session: any) {
    const didError = error != null

    return {
      type: actionTypes.SESSION_RESPONSE,
      error: didError,
      payload: !didError
        ? session
        : error
    }
  },

  setDeckPopulated (payload: boolean) {
    return {type: actionTypes.SET_DECK_POPULATED, payload}
  },

  // pick up a tip with intrument on `mount` from tiprack in `slot`
  pickupAndHome (mount: Mount, slot: Slot): LabwareCalibrationAction {
    return {
      type: 'robot:PICKUP_AND_HOME',
      payload: {mount, slot},
      meta: {robotCommand: true}
    }
  },

  // response for pickup and home
  pickupAndHomeResponse (error: ?Error = null): CalibrationResponseAction {
    return {
      type: 'robot:PICKUP_AND_HOME_RESPONSE',
      error: error != null,
      payload: error || {}
    }
  },

  // drop the tip on instrument on `mount` into the tiprack in `slot`
  dropTipAndHome (mount: Mount, slot: Slot): LabwareCalibrationAction {
    return {
      type: 'robot:DROP_TIP_AND_HOME',
      payload: {mount, slot},
      meta: {robotCommand: true}
    }
  },

  // response for drop tip and home
  dropTipAndHomeResponse (error: ?Error = null): CalibrationResponseAction {
    return {
      type: 'robot:DROP_TIP_AND_HOME_RESPONSE',
      error: error != null,
      payload: error || {}
    }
  },

  // set tiprack to calibrated and conditionally drop the tip
  confirmTiprack (mount: Mount, slot: Slot): LabwareCalibrationAction {
    return {
      type: 'robot:CONFIRM_TIPRACK',
      payload: {mount, slot},
      meta: {robotCommand: true}
    }
  },

  // response for pickup and home
  // payload.tipOn is a flag for whether a tip remains on the instrument
  confirmTiprackResponse (
    error: ?Error = null,
    tipOn: boolean = false
  ): CalibrationResponseAction {
    return {
      type: 'robot:CONFIRM_TIPRACK_RESPONSE',
      error: error != null,
      payload: error || {tipOn}
    }
  },

  moveToFront (instrument: Mount) {
    return tagForRobotApi({
      type: actionTypes.MOVE_TO_FRONT,
      payload: {instrument}
    })
  },

  moveToFrontResponse (error: ?Error = null) {
    const action: {type: string, error: boolean, payload?: Error} = {
      type: actionTypes.MOVE_TO_FRONT_RESPONSE,
      error: error != null
    }
    if (error) action.payload = error

    return action
  },

  probeTip (instrument: Mount) {
    return tagForRobotApi({type: actionTypes.PROBE_TIP, payload: {instrument}})
  },

  probeTipResponse (error: ?Error = null) {
    const action: {type: string, error: boolean, payload?: Error} = {
      type: actionTypes.PROBE_TIP_RESPONSE,
      error: error != null
    }
    if (error) action.payload = error

    return action
  },

  confirmProbed (instrument: Mount): ConfirmProbedAction {
    return {type: 'robot:CONFIRM_PROBED', payload: instrument}
  },

  moveTo (instrument: Mount, labware: Slot) {
    return tagForRobotApi({
      type: actionTypes.MOVE_TO,
      payload: {instrument, labware}
    })
  },

  moveToResponse (error: ?Error = null) {
    const action: {type: string, error: boolean, payload?: Error} = {
      type: actionTypes.MOVE_TO_RESPONSE,
      error: error != null
    }
    if (error) action.payload = error

    return action
  },

  toggleJogDistance () {
    return {type: actionTypes.TOGGLE_JOG_DISTANCE}
  },

  jog (instrument: Mount, axis: Axis, direction: Direction) {
    return tagForRobotApi({
      type: actionTypes.JOG,
      payload: {instrument, axis, direction}
    })
  },

  jogResponse (error: ?Error = null) {
    const action: {type: string, error: boolean, payload?: Error} = {
      type: actionTypes.JOG_RESPONSE,
      error: error != null
    }
    if (error) action.payload = error

    return action
  },

  // update the offset of labware in slot using position of pipette on mount
  updateOffset (mount: Mount, slot: Slot): LabwareCalibrationAction {
    return {
      type: 'robot:UPDATE_OFFSET',
      payload: {mount, slot},
      meta: {robotCommand: true}
    }
  },

  // response for updateOffset
  // payload.isTiprack is a flag for whether or not the labware is a tiprack
  updateOffsetResponse (
    error: ?Error = null,
    isTiprack: boolean
  ): CalibrationResponseAction {
    return {
      type: 'robot:UPDATE_OFFSET_RESPONSE',
      error: error != null,
      payload: error || {isTiprack}
    }
  },

  confirmLabware (labware: Slot) {
    return {type: actionTypes.CONFIRM_LABWARE, payload: {labware}}
  },

  run () {
    return tagForRobotApi({type: actionTypes.RUN})
  },

  runResponse (error: ?Error = null) {
    const action: {type: string, error: boolean, payload?: Error} = {
      type: actionTypes.RUN_RESPONSE,
      error: error != null
    }
    if (error) action.payload = error

    return action
  },

  pause () {
    return tagForRobotApi({type: actionTypes.PAUSE})
  },

  pauseResponse (error: ?Error = null) {
    const action: {type: string, error: boolean, payload?: Error} = {
      type: actionTypes.PAUSE_RESPONSE,
      error: error != null
    }
    if (error) action.payload = error

    return action
  },

  resume () {
    return tagForRobotApi({type: actionTypes.RESUME})
  },

  resumeResponse (error: ?Error = null) {
    const action: {type: string, error: boolean, payload?: Error} = {
      type: actionTypes.RESUME_RESPONSE,
      error: error != null
    }
    if (error) action.payload = error

    return action
  },

  cancel () {
    return tagForRobotApi({type: actionTypes.CANCEL})
  },

  cancelResponse (error: ?Error = null) {
    const action: {type: string, error: boolean, payload?: Error} = {
      type: actionTypes.CANCEL_RESPONSE,
      error: error != null
    }
    if (error) action.payload = error

    return action
  },

  tickRunTime () {
    return {type: actionTypes.TICK_RUN_TIME}
  }
}
