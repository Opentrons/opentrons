// robot reducer
import path from 'path'
import {NAME, actionTypes, constants} from './'

// selector and reducer helpers
const getModuleState = (state) => state[NAME]

const makeRequestState = () => ({inProgress: false, error: null})

const handleRequest = (state, request, payload, error, props = {}) => ({
  ...state,
  ...props,
  [request]: {...state[request], inProgress: true, error: null}
})

const handleResponse = (state, request, payload, error, props = {}) => ({
  ...state,
  ...props,
  [request]: {...state[request], inProgress: false, error}
})

const INITIAL_STATE = {
  // robot connection and prep
  connectRequest: makeRequestState(),
  homeRequest: makeRequestState(),

  // robot protocol and running
  runRequest: makeRequestState(),
  pauseRequest: makeRequestState(),
  resumeRequest: makeRequestState(),
  cancelRequest: makeRequestState(),

  // instantaneous robot state below
  // protocol
  // TODO(mc, 2017-08-24): move protocol to its own state module
  // TODO(mc, 2017-08-23): DO NOT hardcode this protocol!
  protocol: '/Users/mc/opentrons/opentrons/api/opentrons/server/tests/data/dinosaur.py',
  protocolError: null,
  // is connected to compute
  isConnected: false,
  // is running a protocol
  isRunning: false,
  // protocol commands list
  commands: [],
  currentCommand: -1
}

export const selectors = {
  getProtocolFile (allState) {
    return getModuleState(allState).protocol
  },

  getProtocolName (allState) {
    return path.basename(selectors.getProtocolFile(allState))
  },

  getConnectionStatus (allState) {
    const state = getModuleState(allState)
    if (state.isConnected) return constants.CONNECTED
    if (state.connectRequest.inProgress) return constants.CONNECTING
    return constants.DISCONNECTED
  },

  getIsReadyToRun (allState) {
    const state = getModuleState(allState)
    return state.isConnected && (state.commands.length > 0)
  },

  getCommands (allState) {
    const state = getModuleState(allState)
    const currentCommand = state.currentCommand

    return state.commands.map((command, index) => ({
      // TODO(mc, 2017-08-23): generate command IDs on python side instead
      id: index,
      description: command,
      isCurrent: index === currentCommand
    }))
  }
}

export function reducer (state = INITIAL_STATE, action) {
  const {type, payload, error} = action

  switch (type) {
    case actionTypes.CONNECT:
      return handleRequest(state, 'connectRequest', payload, error)

    case actionTypes.CONNECT_RESPONSE:
      return handleResponse(state, 'connectRequest', payload, error, {
        isConnected: error == null
      })

    case actionTypes.HOME:
      return handleRequest(state, 'homeRequest', payload, error)

    case actionTypes.HOME_RESPONSE:
      return handleResponse(state, 'homeRequest', payload, error)

    // TODO(mc): for now, naively assume that if a run request is dispatched
    // the robot is running
    case actionTypes.RUN:
      return handleRequest(state, 'runRequest', payload, error, {
        isRunning: true
      })

    case actionTypes.RUN_RESPONSE:
      return handleResponse(state, 'runRequest', payload, error, {
        isRunning: false
      })

    case actionTypes.PAUSE:
      return handleRequest(state, 'pauseRequest', payload, error)

    case actionTypes.PAUSE_RESPONSE:
      return handleResponse(state, 'pauseRequest', payload, error, {
        isPaused: error == null
      })

    case actionTypes.RESUME:
      return handleRequest(state, 'resumeRequest', payload, error)

    case actionTypes.RESUME_RESPONSE:
      return handleResponse(state, 'resumeRequest', payload, error, {
        isPaused: error != null
      })

    case actionTypes.CANCEL:
      return handleRequest(state, 'cancelRequest', payload, error)

    case actionTypes.CANCEL_RESPONSE:
      return handleResponse(state, 'cancelRequest', payload, error, {
        isRunning: error != null,
        isPaused: error != null
      })

    case actionTypes.SET_IS_CONNECTED:
      return {...state, ...payload}

    case actionTypes.SET_COMMANDS:
      return {...state, commands: payload.commands, currentCommand: -1}

    case actionTypes.SET_PROTOCOL_ERROR:
      return {...state, protocolError: error}

    case actionTypes.TICK_CURRENT_COMMAND:
      return {...state, currentCommand: state.currentCommand + 1}
  }

  return state
}
