// robot reducer
import path from 'path'
import {actionTypes} from './actions'
import NAME from './name'

// miscellaneous constants
export const constants = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected'
}

// state helpers
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
  // robot API connection
  connectRequest: makeRequestState(),
  isConnected: false,

  // protocol/workflow session
  // TODO(mc, 2017-08-24): move session to its own state module or sub-reducer
  sessionRequest: makeRequestState(),
  sessionName: '',
  protocolText: '',
  protocolCommands: [],
  protocolCommandsById: {},
  sessionErrors: [],
  sessionState: '',

  // robot calibration and setup
  homeRequest: makeRequestState(),

  // running a protocol
  runRequest: makeRequestState(),
  pauseRequest: makeRequestState(),
  resumeRequest: makeRequestState(),
  cancelRequest: makeRequestState(),
  isRunning: false,
  isPaused: false
}

export const selectors = {
  getSessionName (allState) {
    return getModuleState(allState).sessionName
  },

  getConnectionStatus (allState) {
    const state = getModuleState(allState)
    if (state.isConnected) return constants.CONNECTED
    if (state.connectRequest.inProgress) return constants.CONNECTING
    return constants.DISCONNECTED
  },

  getIsReadyToRun (allState) {
    const state = getModuleState(allState)
    return state.isConnected && (state.protocolCommands.length > 0)
  },

  getCommands (allState) {
    const {protocolCommands, protocolCommandsById} = getModuleState(allState)

    return protocolCommands.map(idToCommandList(true))

    function idToCommandList (parentIsCurrent) {
      return function mapIdToCommand (id, index, commands) {
        const command = protocolCommandsById[id]
        const next = protocolCommandsById[commands[index + 1]]
        const isCurrent = (
          parentIsCurrent &&
          command.handledAt &&
          (!next || !next.handledAt)
        ) || false
        const children = command.children.map(idToCommandList(isCurrent))

        return {...command, children, isCurrent}
      }
    }
  },

  getRunProgress (allState) {
    // TODO(mc, 2017-08-30): Memoize
    const commands = selectors.getCommands(allState)
    const currentCommand = commands.find((c) => c.isCurrent)

    return 100 * (commands.indexOf(currentCommand) + 1) / commands.length
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

    case actionTypes.SESSION:
      return handleRequest(state, 'sessionRequest', payload, error, {
        sessionName: payload && payload.file && payload.file.name
          ? path.basename(payload.file.name)
          : state.sessionName
      })

    case actionTypes.SESSION_RESPONSE:
      return handleResponse(state, 'sessionRequest', payload, error, payload)

    case actionTypes.HOME:
      return handleRequest(state, 'homeRequest', payload, error)

    case actionTypes.HOME_RESPONSE:
      return handleResponse(state, 'homeRequest', payload, error)

    // TODO(mc): for now, naively assume that if a run request is dispatched
    // the robot is running
    case actionTypes.RUN:
      return handleRequest(state, 'runRequest', payload, error, {
        isRunning: true,
        currentCommand: -1
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

    case actionTypes.SET_COMMANDS:
      return {...state, commands: payload.commands, currentCommand: -1}

    case actionTypes.TICK_CURRENT_COMMAND:
      return {...state, currentCommand: state.currentCommand + 1}
  }

  return state
}
