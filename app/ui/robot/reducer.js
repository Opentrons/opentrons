// robot reducer
import path from 'path'
import {actionTypes} from './actions'
import NAME from './name'

// miscellaneous constants
export const constants = {
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',

  // session states
  LOADED: 'loaded',
  RUNNING: 'running',
  PAUSED: 'paused',
  ERROR: 'error',
  FINISHED: 'finished',
  STOPPED: 'stopped'
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
    return getModuleState(allState).sessionState === constants.LOADED
  },

  getIsRunning (allState) {
    const sessionState = getModuleState(allState).sessionState
    return (
      sessionState === constants.RUNNING ||
      sessionState === constants.PAUSED
    )
  },

  getIsPaused (allState) {
    return getModuleState(allState).sessionState === constants.PAUSED
  },

  getIsDone (allState) {
    const sessionState = getModuleState(allState).sessionState
    return (
      sessionState === constants.ERROR ||
      sessionState === constants.FINISHED ||
      sessionState === constants.STOPPED
    )
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
        sessionName: path.basename(payload.file.name)
      })

    case actionTypes.SESSION_RESPONSE:
      return handleResponse(state, 'sessionRequest', payload, error, payload.session)

    case actionTypes.HOME:
      return handleRequest(state, 'homeRequest', payload, error)

    case actionTypes.HOME_RESPONSE:
      return handleResponse(state, 'homeRequest', payload, error)

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
  }

  return state
}
