// robot reducer
import padStart from 'lodash/padStart'
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
  STOPPED: 'stopped',

  // deck layout
  INSTRUMENT_AXES: ['left', 'right'],
  DECK_SLOTS: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],

  // pipette channels
  SINGLE_CHANNEL: 'single',
  MULTI_CHANNEL: 'multi'
}

// state helpers
const getModuleState = (state) => state[NAME]
const makeRequestState = () => ({inProgress: false, error: null})
// const makeInstrumentState = () => ({})

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
  disconnectRequest: makeRequestState(),
  isConnected: false,

  // protocol/workflow session
  // TODO(mc, 2017-08-24): move session to its own state module or sub-reducer
  sessionRequest: makeRequestState(),
  sessionName: '',
  sessionState: '',
  sessionErrors: [],

  protocolText: '',
  protocolCommands: [],
  protocolCommandsById: {},
  protocolInstrumentsByAxis: {},
  protocolLabwareBySlot: {},

  // robot calibration and setup
  homeRequest: makeRequestState(),

  // running a protocol
  runRequest: makeRequestState(),
  pauseRequest: makeRequestState(),
  resumeRequest: makeRequestState(),
  cancelRequest: makeRequestState(),
  runTime: 0
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
    const {sessionState} = getModuleState(allState)
    return (
      sessionState === constants.RUNNING ||
      sessionState === constants.PAUSED
    )
  },

  getIsPaused (allState) {
    return getModuleState(allState).sessionState === constants.PAUSED
  },

  getIsDone (allState) {
    const {sessionState} = getModuleState(allState)
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
        const isLast = isCurrent && !command.children.length
        const children = command.children.map(idToCommandList(isCurrent))

        return {...command, children, isCurrent, isLast}
      }
    }
  },

  getRunProgress (allState) {
    // TODO(mc, 2017-08-30): Memoize
    const commands = selectors.getCommands(allState)
    const currentCommand = commands.find((c) => c.isCurrent)

    return 100 * (commands.indexOf(currentCommand) + 1) / commands.length
  },

  getStartTime (allState) {
    // TODO(mc, 2017-08-30): Memoize
    const commands = selectors.getCommands(allState)

    if (!commands.length) return ''
    return commands[0].handledAt
  },

  getRunTime (allState) {
    const {runTime} = getModuleState(allState)
    const startTime = selectors.getStartTime(allState)
    const runTimeSeconds = (runTime && startTime)
      ? Math.floor((runTime - Date.parse(startTime)) / 1000)
      : 0

    const hours = padStart(Math.floor(runTimeSeconds / 3600), 2, '0')
    const minutes = padStart(Math.floor(runTimeSeconds / 60) % 60, 2, '0')
    const seconds = padStart(runTimeSeconds % 60, 2, '0')

    return `${hours}:${minutes}:${seconds}`
  },

  getInstruments (allState) {
    const {
      protocolInstrumentsByAxis,
      instrumentCalibrationByAxis
    } = getModuleState(allState)

    return constants.INSTRUMENT_AXES.map((axis) => {
      const instrument = protocolInstrumentsByAxis[axis] || {axis}
      const calibration = instrumentCalibrationByAxis[axis] || {}

      if (instrument.channels === 1) {
        instrument.channels = constants.SINGLE_CHANNEL
      } else if (instrument.channels > 1) {
        instrument.channels = constants.MULTI_CHANNEL
      }

      return {...instrument, ...calibration}
    })
  },

  getDeck (allState) {
    const {
      protocolLabwareBySlot,
      labwareConfirmationBySlot
    } = getModuleState(allState)

    return constants.DECK_SLOTS.map((slot) => {
      const labware = protocolLabwareBySlot[slot] || {slot}
      const confirmation = labwareConfirmationBySlot[slot] || {}

      return {...labware, ...confirmation}
    })
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

    case actionTypes.DISCONNECT:
      return handleRequest(state, 'disconnectRequest', payload, error)

    case actionTypes.DISCONNECT_RESPONSE:
      return handleResponse(state, 'disconnectRequest', payload, error, {
        isConnected: error != null,
        sessionName: error ? state.sessionName : '',
        protocolText: error ? state.protocolText : '',
        protocolCommands: error ? state.protocolCommands : [],
        protocolCommandsById: error ? state.protocolCommandsById : {},
        sessionErrors: error ? state.sessionErrors : [],
        sessionState: error ? state.sessionState : ''
      })

    case actionTypes.SESSION:
      return handleRequest(state, 'sessionRequest', payload, error, {
        sessionName: payload.file.name
      })

    case actionTypes.SESSION_RESPONSE:
      return handleResponse(state, 'sessionRequest', payload, error, payload.session)

    case actionTypes.HOME:
      return handleRequest(state, 'homeRequest', payload, error)

    case actionTypes.HOME_RESPONSE:
      return handleResponse(state, 'homeRequest', payload, error)

    case actionTypes.RUN:
      return handleRequest(state, 'runRequest', payload, error, {
        runTime: 0
      })

    case actionTypes.RUN_RESPONSE:
      return handleResponse(state, 'runRequest', payload, error)

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

    case actionTypes.TICK_RUN_TIME:
      return {...state, runTime: Date.now()}
  }

  return state
}
