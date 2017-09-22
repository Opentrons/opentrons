// robot actions and action types
// action helpers
import {makeActionName} from '../util'
import NAME from './name'

const makeRobotActionName = (action) => makeActionName(NAME, action)
const makeRobotAction = (action) => ({...action, meta: {robotCommand: true}})

export const actionTypes = {
  // requests and responses
  CONNECT: makeRobotActionName('CONNECT'),
  CONNECT_RESPONSE: makeRobotActionName('CONNECT_RESPONSE'),
  DISCONNECT: makeRobotActionName('DISCONNECT'),
  DISCONNECT_RESPONSE: makeRobotActionName('DISCONNECT_RESPONSE'),
  SESSION: makeRobotActionName('SESSION'),
  SESSION_RESPONSE: makeRobotActionName('SESSION_RESPONSE'),
  HOME: makeRobotActionName('HOME'),
  HOME_RESPONSE: makeRobotActionName('HOME_RESPONSE'),
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

  connectResponse (error = null) {
    return {type: actionTypes.CONNECT_RESPONSE, error}
  },

  // TODO(mc, 2017-09-07): connect should take a URL or robot identifier
  disconnect () {
    return makeRobotAction({type: actionTypes.DISCONNECT})
  },

  disconnectResponse (error = null) {
    return {type: actionTypes.DISCONNECT_RESPONSE, error}
  },

  // get session or make new session with protocol file
  session (file) {
    return makeRobotAction({type: actionTypes.SESSION, payload: {file}})
  },

  sessionResponse (error = null, session) {
    return {type: actionTypes.SESSION_RESPONSE, payload: {session}, error}
  },

  home (axes) {
    const action = makeRobotAction({type: actionTypes.HOME})
    if (axes != null) action.payload = {axes}

    return action
  },

  homeResponse (error = null) {
    return {type: actionTypes.HOME_RESPONSE, error}
  },

  run () {
    return makeRobotAction({type: actionTypes.RUN})
  },

  runResponse (error = null) {
    return {type: actionTypes.RUN_RESPONSE, error}
  },

  pause () {
    return makeRobotAction({type: actionTypes.PAUSE})
  },

  pauseResponse (error) {
    return {type: actionTypes.PAUSE_RESPONSE, error}
  },

  resume () {
    return makeRobotAction({type: actionTypes.RESUME})
  },

  resumeResponse (error) {
    return {type: actionTypes.RESUME_RESPONSE, error}
  },

  cancel () {
    return makeRobotAction({type: actionTypes.CANCEL})
  },

  cancelResponse (error) {
    return {type: actionTypes.CANCEL_RESPONSE, error}
  },

  tickRunTime () {
    return {type: actionTypes.TICK_RUN_TIME}
  }
}
