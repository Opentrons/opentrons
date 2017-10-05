// robot actions and action types
// action helpers
import {makeActionName} from '../util'
import NAME from './name'

const makeRobotActionName = (action) => makeActionName(NAME, action)
const makeRobotAction = (action) => ({...action, meta: {robotCommand: true}})

export const actionTypes = {
  // connect and disconnect
  CONNECT: makeRobotActionName('CONNECT'),
  CONNECT_RESPONSE: makeRobotActionName('CONNECT_RESPONSE'),
  DISCONNECT: makeRobotActionName('DISCONNECT'),
  DISCONNECT_RESPONSE: makeRobotActionName('DISCONNECT_RESPONSE'),

  // protocol loading
  SESSION: makeRobotActionName('SESSION'),
  SESSION_RESPONSE: makeRobotActionName('SESSION_RESPONSE'),

  // calibration
  HOME: makeRobotActionName('HOME'),
  HOME_RESPONSE: makeRobotActionName('HOME_RESPONSE'),
  MOVE_TO_FRONT: makeRobotActionName('MOVE_TO_FRONT'),
  MOVE_TO_FRONT_RESPONSE: makeRobotActionName('MOVE_TO_FRONT_RESPONSE'),
  PROBE_TIP: makeRobotActionName('PROBE_TIP'),
  PROBE_TIP_RESPONSE: makeRobotActionName('PROBE_TIP_RESPONSE'),
  MOVE_TO: makeRobotActionName('MOVE_TO'),
  MOVE_TO_RESPONSE: makeRobotActionName('MOVE_TO_RESPONSE'),
  JOG: makeRobotActionName('JOG'),
  JOG_RESPONSE: makeRobotActionName('JOG_RESPONSE'),
  UPDATE_OFFSET: makeRobotActionName('UPDATE_OFFSET'),
  UPDATE_OFFSET_RESPONSE: makeRobotActionName('UPDATE_OFFSET_RESPONSE'),

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
  // TODO(mc): connect should take a URL or robot identifier
  connect () {
    return makeRobotAction({type: actionTypes.CONNECT})
  },

  // TODO(mc, 2017-10-04): make this action FSA compliant (error [=] bool)
  connectResponse (error = null) {
    return {type: actionTypes.CONNECT_RESPONSE, error}
  },

  // TODO(mc, 2017-09-07): disconnect should take a URL or robot identifier
  disconnect () {
    return makeRobotAction({type: actionTypes.DISCONNECT})
  },

  // TODO(mc, 2017-10-04): make this action FSA compliant (error [=] bool)
  disconnectResponse (error = null) {
    return {type: actionTypes.DISCONNECT_RESPONSE, error}
  },

  // get session or make new session with protocol file
  session (file) {
    return makeRobotAction({type: actionTypes.SESSION, payload: {file}})
  },

  // TODO(mc, 2017-10-04): make this action FSA compliant (error [=] bool)
  sessionResponse (error = null, session) {
    return {type: actionTypes.SESSION_RESPONSE, payload: {session}, error}
  },

  home (axes) {
    const action = makeRobotAction({type: actionTypes.HOME})
    if (axes != null) action.payload = {axes}

    return action
  },

  // TODO(mc, 2017-10-04): make this action FSA compliant (error [=] bool)
  homeResponse (error = null) {
    return {type: actionTypes.HOME_RESPONSE, error}
  },

  moveToFront (instrument) {
    return makeRobotAction({
      type: actionTypes.MOVE_TO_FRONT,
      payload: {instrument}
    })
  },

  moveToFrontResponse (error = null) {
    const action = {
      type: actionTypes.MOVE_TO_FRONT_RESPONSE,
      error: error != null
    }
    if (error) action.payload = error

    return action
  },

  probeTip (instrument) {
    return makeRobotAction({type: actionTypes.PROBE_TIP, payload: {instrument}})
  },

  probeTipResponse (error = null) {
    const action = {type: actionTypes.PROBE_TIP_RESPONSE, error: error != null}
    if (error) action.payload = error

    return action
  },

  moveTo (instrument, labware) {
    return makeRobotAction({
      type: actionTypes.MOVE_TO,
      payload: {instrument, labware}
    })
  },

  moveToResponse (error = null) {
    const action = {type: actionTypes.MOVE_TO_RESPONSE, error: error != null}
    if (error) action.payload = error

    return action
  },

  jog (instrument, coordinates) {
    return makeRobotAction({
      type: actionTypes.JOG,
      payload: {instrument, coordinates}
    })
  },

  jogResponse (error = null) {
    const action = {type: actionTypes.JOG_RESPONSE, error: error != null}
    if (error) action.payload = error

    return action
  },

  updateOffset (instrument, labware) {
    return makeRobotAction({
      type: actionTypes.UPDATE_OFFSET,
      payload: {instrument, labware}
    })
  },

  updateOffsetResponse (error = null) {
    const action = {
      type: actionTypes.UPDATE_OFFSET_RESPONSE,
      error: error != null
    }
    if (error) action.payload = error

    return action
  },

  run () {
    return makeRobotAction({type: actionTypes.RUN})
  },

  // TODO(mc, 2017-10-04): make this action FSA compliant (error [=] bool)
  runResponse (error = null) {
    return {type: actionTypes.RUN_RESPONSE, error}
  },

  pause () {
    return makeRobotAction({type: actionTypes.PAUSE})
  },

  // TODO(mc, 2017-10-04): make this action FSA compliant (error [=] bool)
  pauseResponse (error) {
    return {type: actionTypes.PAUSE_RESPONSE, error}
  },

  resume () {
    return makeRobotAction({type: actionTypes.RESUME})
  },

  // TODO(mc, 2017-10-04): make this action FSA compliant (error [=] bool)
  resumeResponse (error) {
    return {type: actionTypes.RESUME_RESPONSE, error}
  },

  cancel () {
    return makeRobotAction({type: actionTypes.CANCEL})
  },

  // TODO(mc, 2017-10-04): make this action FSA compliant (error [=] bool)
  cancelResponse (error) {
    return {type: actionTypes.CANCEL_RESPONSE, error}
  },

  tickRunTime () {
    return {type: actionTypes.TICK_RUN_TIME}
  }
}
