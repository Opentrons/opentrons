// robot UI entry point
// split up into reducer.js, action.js, etc if / when necessary
import path from 'path'
import api from './api-client'

export const NAME = 'robot'

// reducer / action helpers
const makeActionName = (action) => `${NAME}:${action}`
const makeRequestState = () => ({inProgress: false, error: null})

const INITIAL_STATE = {
  // robot connection
  // TODO(mc): explore combining request state with result state
  connectRequest: makeRequestState(),
  homeRequest: makeRequestState(),
  runRequest: makeRequestState(),

  // instantaneous robot state below
  // protocol
  // TODO(mc, 2017-08-23): do not hardcode this protocol!
  protocol: path.join(
    __dirname,
    '../../../api/opentrons/server/tests/data/dinosaur.py'
  ),
  protocolError: null,
  // is connected to compute
  isConnected: false,
  // is running a protocol
  isRunning: false,
  // protocol commands list
  commands: [],
  currentCommand: -1
}

// miscellaneous constants
export const constants = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected'
}

export const selectors = {
  getProtocolFile (state) {
    return state.protocol
  },

  getProtocolName (state) {
    return path.basename(selectors.getProtocolFile(state))
  },

  getConnectionStatus (state) {
    if (state.isConnected) return constants.CONNECTED
    if (state.connectRequest.inProgress) return constants.CONNECTING
    return constants.DISCONNECTED
  }
}

export const apiClientMiddleware = api

export const actionTypes = {
  // requests and responses
  CONNECT: makeActionName('CONNECT'),
  CONNECT_RESPONSE: makeActionName('CONNECT_RESPONSE'),
  LOAD_PROTOCOL: makeActionName('LOAD_PROTOCOL'),
  HOME: makeActionName('HOME'),
  HOME_RESPONSE: makeActionName('HOME_RESPONSE'),
  RUN: makeActionName('RUN'),
  RUN_RESPONSE: makeActionName('RUN_RESPONSE'),

  // instantaneous state
  SET_IS_CONNECTED: makeActionName('SET_IS_CONNECTED'),
  // TODO(mc, 2017-08-23): consider combining set commands and set protocol
  // error into a single loadProtocolResponse action
  SET_COMMANDS: makeActionName('SET_COMMANDS'),
  SET_PROTOCOL_ERROR: makeActionName('SET_PROTOCOL_ERROR'),
  TICK_CURRENT_COMMAND: makeActionName('TICK_CURRENT_COMMAND')
}

export const actions = {
  // TODO(mc): connect should take a URL or robot identifier
  connect () {
    return {
      type: actionTypes.CONNECT,
      meta: {robotCommand: true}
    }
  },

  connectResponse (error = null) {
    return {
      type: actionTypes.CONNECT_RESPONSE,
      error
    }
  },

  loadProtocol () {
    return {
      type: actionTypes.LOAD_PROTOCOL
    }
  },

  home (axes) {
    const action = {
      type: actionTypes.HOME,
      meta: {robotCommand: true}
    }

    if (axes != null) action.payload = {axes}

    return action
  },

  homeResponse (error = null) {
    return {
      type: actionTypes.HOME_RESPONSE,
      error
    }
  },

  run () {
    return {
      type: actionTypes.RUN,
      meta: {robotCommand: true}
    }
  },

  runResponse (error = null) {
    return {
      type: actionTypes.RUN_RESPONSE,
      error
    }
  },

  setIsConnected (isConnected) {
    return {
      type: actionTypes.SET_IS_CONNECTED,
      payload: {isConnected}
    }
  },

  setCommands (commands) {
    return {
      type: actionTypes.SET_COMMANDS,
      payload: {commands}
    }
  },

  setProtocolError (error) {
    return {
      type: actionTypes.SET_PROTOCOL_ERROR,
      error
    }
  },

  tickCurrentCommand () {
    return {
      type: actionTypes.TICK_CURRENT_COMMAND
    }
  }
}

export function reducer (state = INITIAL_STATE, action) {
  const {type, payload, error} = action

  switch (type) {
    case actionTypes.CONNECT:
      return {
        ...state,
        connectRequest: {...state.connectRequest, inProgress: true, error: null}
      }

    case actionTypes.CONNECT_RESPONSE:
      return {
        ...state,
        isConnected: !error,
        connectRequest: {...state.connectRequest, inProgress: false, error}
      }

    case actionTypes.HOME:
      return {
        ...state,
        homeRequest: {...state.homeRequest, inProgress: true, error: null}
      }

    case actionTypes.HOME_RESPONSE:
      return {
        ...state,
        homeRequest: {...state.homeRequest, inProgress: false, error}
      }

    case actionTypes.RUN:
      return {
        ...state,
        runRequest: {...state.runRequest, inProgress: true, error: null},
        // TODO(mc): for now, naively assume that if a run request is dispatched
        // the robot is running
        isRunning: true
      }

    case actionTypes.RUN_RESPONSE:
      return {
        ...state,
        runRequest: {...state.runRequest, inProgress: false, error},
        isRunning: false
      }

    case actionTypes.SET_IS_CONNECTED:
      return {...state, ...payload}

    case actionTypes.SET_COMMANDS:
      return {...state, commands: payload.commands}

    case actionTypes.SET_PROTOCOL_ERROR:
      return {...state, protocolError: error}

    case actionTypes.TICK_CURRENT_COMMAND:
      return {...state, currentCommand: state.currentCommand + 1}
  }

  return state
}
