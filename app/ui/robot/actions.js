// robot actions and action types
// action helpers
import {makeActionName} from '../util'
import {tagAction as tagForAnalytics} from '../analytics'
import {_NAME as NAME} from './constants'

// TODO(mc, 2017-11-22): rename this function to actionType
const makeRobotActionName = (action) => makeActionName(NAME, action)
const tagForRobotApi = (action) => ({...action, meta: {robotCommand: true}})

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
  SET_LABWARE_REVIEWED: makeRobotActionName('SET_LABWARE_REVIEWED'),
  SET_CURRENT_LABWARE: makeRobotActionName('SET_CURRENT_LABWARE'),
  SET_CURRENT_INSTRUMENT: makeRobotActionName('SET_CURRENT_INSTRUMENT'),
  PICKUP_AND_HOME: makeRobotActionName('PICKUP_AND_HOME'),
  PICKUP_AND_HOME_RESPONSE: makeRobotActionName('PICKUP_AND_HOME_RESPONSE'),
  HOME_INSTRUMENT: makeRobotActionName('HOME_INSTRUMENT'),
  HOME_INSTRUMENT_RESPONSE: makeRobotActionName('HOME_INSTRUMENT_RESPONSE'),
  CONFIRM_TIPRACK: makeRobotActionName('CONFIRM_TIPRACK'),
  CONFIRM_TIPRACK_RESPONSE: makeRobotActionName('CONFIRM_TIPRACK_RESPONSE'),
  MOVE_TO_FRONT: makeRobotActionName('MOVE_TO_FRONT'),
  MOVE_TO_FRONT_RESPONSE: makeRobotActionName('MOVE_TO_FRONT_RESPONSE'),
  PROBE_TIP: makeRobotActionName('PROBE_TIP'),
  PROBE_TIP_RESPONSE: makeRobotActionName('PROBE_TIP_RESPONSE'),
  RESET_TIP_PROBE: makeRobotActionName('RESET_TIP_PROBE'),
  MOVE_TO: makeRobotActionName('MOVE_TO'),
  MOVE_TO_RESPONSE: makeRobotActionName('MOVE_TO_RESPONSE'),
  TOGGLE_JOG_DISTANCE: makeRobotActionName('TOGGLE_JOG_DISTANCE'),
  JOG: makeRobotActionName('JOG'),
  JOG_RESPONSE: makeRobotActionName('JOG_RESPONSE'),
  UPDATE_OFFSET: makeRobotActionName('UPDATE_OFFSET'),
  UPDATE_OFFSET_RESPONSE: makeRobotActionName('UPDATE_OFFSET_RESPONSE'),
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

export const actions = {
  discover () {
    return tagForRobotApi({type: actionTypes.DISCOVER})
  },

  discoverFinish () {
    return {type: actionTypes.DISCOVER_FINISH}
  },

  connect (host) {
    return tagForRobotApi({type: actionTypes.CONNECT, payload: {host}})
  },

  connectResponse (error) {
    const didError = error != null
    const action = {type: actionTypes.CONNECT_RESPONSE, error: didError}

    if (didError) return {...action, payload: error}

    return tagForAnalytics(action)
  },

  disconnect () {
    return tagForRobotApi({type: actionTypes.DISCONNECT})
  },

  disconnectResponse (error) {
    const didError = error != null
    const action = {type: actionTypes.DISCONNECT_RESPONSE, error: didError}
    if (didError) action.payload = error

    return action
  },

  addDiscovered (service) {
    return {type: actionTypes.ADD_DISCOVERED, payload: service}
  },

  removeDiscovered (host) {
    return {type: actionTypes.REMOVE_DISCOVERED, payload: {host}}
  },

  // get session or make new session with protocol file
  session (file) {
    return tagForRobotApi({type: actionTypes.SESSION, payload: {file}})
  },

  sessionResponse (error, session) {
    const didError = error != null

    return {
      type: actionTypes.SESSION_RESPONSE,
      error: didError,
      payload: !didError
        ? session
        : error
    }
  },

  setLabwareReviewed (payload) {
    return {type: actionTypes.SET_LABWARE_REVIEWED, payload}
  },

  pickupAndHome (instrument, labware) {
    return tagForRobotApi({
      type: actionTypes.PICKUP_AND_HOME,
      payload: {instrument, labware}
    })
  },

  pickupAndHomeResponse (error = null) {
    const action = {
      type: actionTypes.PICKUP_AND_HOME_RESPONSE,
      error: error != null
    }
    if (error) action.payload = error

    return action
  },

  // TODO(mc, 2017-11-22): homeInstrument takes a slot at the moment because
  // this action is performed in the context of confirming a tiprack labware.
  // This is confusing though, so refactor these actions + state-management
  // as necessary
  homeInstrument (instrument, labware) {
    return tagForRobotApi({
      type: actionTypes.HOME_INSTRUMENT,
      payload: {instrument, labware}
    })
  },

  homeInstrumentResponse (error = null) {
    const action = {
      type: actionTypes.HOME_INSTRUMENT_RESPONSE,
      error: error != null
    }
    if (error) action.payload = error

    return action
  },

  // confirm tiprack action drops the tip unless the tiprack is last
  confirmTiprack (instrument, labware) {
    return tagForRobotApi({
      type: actionTypes.CONFIRM_TIPRACK,
      payload: {instrument, labware}
    })
  },

  confirmTiprackResponse (error = null) {
    const action = {
      type: actionTypes.CONFIRM_TIPRACK_RESPONSE,
      error: error != null
    }
    if (error) action.payload = error

    return action
  },

  moveToFront (instrument) {
    return tagForRobotApi({
      type: actionTypes.MOVE_TO_FRONT,
      payload: {instrument}
    })
  },

  moveToFrontResponse (error = null, instrument) {
    const action = {
      type: actionTypes.MOVE_TO_FRONT_RESPONSE,
      error: error != null
    }
    if (error) action.payload = error

    return action
  },

  probeTip (instrument) {
    return tagForRobotApi({type: actionTypes.PROBE_TIP, payload: {instrument}})
  },

  probeTipResponse (error = null) {
    const action = {type: actionTypes.PROBE_TIP_RESPONSE, error: error != null}
    if (error) action.payload = error

    return action
  },

  resetTipProbe (instrument) {
    return {type: actionTypes.RESET_TIP_PROBE, payload: {instrument}}
  },

  moveTo (instrument, labware) {
    return tagForRobotApi({
      type: actionTypes.MOVE_TO,
      payload: {instrument, labware}
    })
  },

  moveToResponse (error = null) {
    const action = {type: actionTypes.MOVE_TO_RESPONSE, error: error != null}
    if (error) action.payload = error

    return action
  },

  toggleJogDistance () {
    return {type: actionTypes.TOGGLE_JOG_DISTANCE}
  },

  jog (instrument, axis, direction) {
    return tagForRobotApi({
      type: actionTypes.JOG,
      payload: {instrument, axis, direction}
    })
  },

  jogResponse (error = null) {
    const action = {type: actionTypes.JOG_RESPONSE, error: error != null}
    if (error) action.payload = error

    return action
  },

  updateOffset (instrument, labware) {
    return tagForRobotApi({
      type: actionTypes.UPDATE_OFFSET,
      payload: {instrument, labware}
    })
  },

  updateOffsetResponse (error = null, isTiprack) {
    return {
      type: actionTypes.UPDATE_OFFSET_RESPONSE,
      error: error != null,
      payload: error || {isTiprack}
    }
  },

  confirmLabware (labware) {
    return {type: actionTypes.CONFIRM_LABWARE, payload: {labware}}
  },

  run () {
    return tagForRobotApi({type: actionTypes.RUN})
  },

  runResponse (error) {
    const didError = error != null
    const action = {type: actionTypes.RUN_RESPONSE, error: didError}
    if (didError) action.payload = error

    return action
  },

  pause () {
    return tagForRobotApi({type: actionTypes.PAUSE})
  },

  pauseResponse (error) {
    const didError = error != null
    const action = {type: actionTypes.PAUSE_RESPONSE, error: didError}
    if (didError) action.payload = error

    return action
  },

  resume () {
    return tagForRobotApi({type: actionTypes.RESUME})
  },

  resumeResponse (error) {
    const didError = error != null
    const action = {type: actionTypes.RESUME_RESPONSE, error: didError}
    if (didError) action.payload = error

    return action
  },

  cancel () {
    return tagForRobotApi({type: actionTypes.CANCEL})
  },

  cancelResponse (error) {
    const didError = error != null
    const action = {type: actionTypes.CANCEL_RESPONSE, error: didError}
    if (didError) action.payload = error

    return action
  },

  tickRunTime () {
    return {type: actionTypes.TICK_RUN_TIME}
  }
}
