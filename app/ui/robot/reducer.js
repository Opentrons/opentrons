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
const makeRequestState = () => ({inProgress: false, error: null})

const handleRequest = (state, request, _, props = {}) => ({
  ...state,
  ...props,
  [request]: {...state[request], inProgress: true, error: null}
})

// TODO(mc, 2017-10-04): Update this function to handle FSA where error is bool
const handleResponse = (state, request, error, props = {}) => ({
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
  moveToFrontRequest: makeRequestState(),
  probeTipRequest: makeRequestState(),
  moveToRequest: makeRequestState(),
  jogRequest: makeRequestState(),
  updateOffsetRequest: makeRequestState(),

  // running a protocol
  runRequest: makeRequestState(),
  pauseRequest: makeRequestState(),
  resumeRequest: makeRequestState(),
  cancelRequest: makeRequestState(),
  runTime: 0
}

// TODO(mc, 2017-10-04): move selectors to own file
export const selectors = {
  getState (allState) {
    return allState[NAME]
  },

  getSessionName (allState) {
    return selectors.getState(allState).sessionName
  },

  getConnectionStatus (allState) {
    const state = selectors.getState(allState)
    if (state.isConnected) return constants.CONNECTED
    if (state.connectRequest.inProgress) return constants.CONNECTING
    return constants.DISCONNECTED
  },

  getIsReadyToRun (allState) {
    return selectors.getState(allState).sessionState === constants.LOADED
  },

  getIsRunning (allState) {
    const {sessionState} = selectors.getState(allState)
    return (
      sessionState === constants.RUNNING ||
      sessionState === constants.PAUSED
    )
  },

  getIsPaused (allState) {
    return selectors.getState(allState).sessionState === constants.PAUSED
  },

  getIsDone (allState) {
    const {sessionState} = selectors.getState(allState)
    return (
      sessionState === constants.ERROR ||
      sessionState === constants.FINISHED ||
      sessionState === constants.STOPPED
    )
  },

  getCommands (allState) {
    const {
      protocolCommands,
      protocolCommandsById
    } = selectors.getState(allState)

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
    const {runTime} = selectors.getState(allState)
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
    } = selectors.getState(allState)

    return constants.INSTRUMENT_AXES.map((axis) => {
      const instrument = protocolInstrumentsByAxis[axis] || {axis}
      const calibration = instrumentCalibrationByAxis[axis] || {isProbed: false}

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
    } = selectors.getState(allState)

    return constants.DECK_SLOTS.map((slot) => {
      const labware = protocolLabwareBySlot[slot] || {slot}
      const confirmation = labwareConfirmationBySlot[slot] || {}

      return {...labware, ...confirmation}
    })
  }
}

export function reducer (state = INITIAL_STATE, action) {
  const {type, payload, error} = action

  // TODO(mc, 2017-10-04): remove when all actions are actually FSA compliant
  const errorPayload = error === true
    ? payload
    : null

  switch (type) {
    case actionTypes.CONNECT:
      return handleRequest(state, 'connectRequest', error)

    case actionTypes.CONNECT_RESPONSE:
      return handleResponse(state, 'connectRequest', error, {
        isConnected: error == null
      })

    case actionTypes.DISCONNECT:
      return handleRequest(state, 'disconnectRequest', error)

    case actionTypes.DISCONNECT_RESPONSE:
      return handleResponse(state, 'disconnectRequest', error, {
        isConnected: error != null,
        sessionName: error ? state.sessionName : '',
        protocolText: error ? state.protocolText : '',
        protocolCommands: error ? state.protocolCommands : [],
        protocolCommandsById: error ? state.protocolCommandsById : {},
        sessionErrors: error ? state.sessionErrors : [],
        sessionState: error ? state.sessionState : ''
      })

    case actionTypes.SESSION:
      return handleRequest(state, 'sessionRequest', error, {
        sessionName: payload.file.name
      })

    case actionTypes.SESSION_RESPONSE:
      return handleResponse(state, 'sessionRequest', error, payload.session)

    case actionTypes.HOME:
      return handleRequest(state, 'homeRequest', error)

    case actionTypes.HOME_RESPONSE:
      return handleResponse(state, 'homeRequest', error)

    case actionTypes.MOVE_TO_FRONT:
      return handleRequest(state, 'moveToFrontRequest', errorPayload)

    case actionTypes.MOVE_TO_FRONT_RESPONSE:
      return handleResponse(state, 'moveToFrontRequest', errorPayload)

    case actionTypes.PROBE_TIP:
      return handleRequest(state, 'probeTipRequest', errorPayload)

    case actionTypes.PROBE_TIP_RESPONSE:
      return handleResponse(state, 'probeTipRequest', errorPayload)

    case actionTypes.MOVE_TO:
      return handleRequest(state, 'moveToRequest', errorPayload)

    case actionTypes.MOVE_TO_RESPONSE:
      return handleResponse(state, 'moveToRequest', errorPayload)

    case actionTypes.JOG:
      return handleRequest(state, 'jogRequest', errorPayload)

    case actionTypes.JOG_RESPONSE:
      return handleResponse(state, 'jogRequest', errorPayload)

    case actionTypes.UPDATE_OFFSET:
      return handleRequest(state, 'updateOffsetRequest', errorPayload)

    case actionTypes.UPDATE_OFFSET_RESPONSE:
      return handleResponse(state, 'updateOffsetRequest', errorPayload)

    case actionTypes.RUN:
      return handleRequest(state, 'runRequest', error, {runTime: 0})

    case actionTypes.RUN_RESPONSE:
      return handleResponse(state, 'runRequest', error)

    case actionTypes.PAUSE:
      return handleRequest(state, 'pauseRequest', error)

    case actionTypes.PAUSE_RESPONSE:
      return handleResponse(state, 'pauseRequest', error, {isPaused: !error})

    case actionTypes.RESUME:
      return handleRequest(state, 'resumeRequest', error)

    case actionTypes.RESUME_RESPONSE:
      return handleResponse(state, 'resumeRequest', error, {isPaused: !!error})

    case actionTypes.CANCEL:
      return handleRequest(state, 'cancelRequest', error)

    case actionTypes.CANCEL_RESPONSE:
      return handleResponse(state, 'cancelRequest', error, {
        isRunning: !!error,
        isPaused: !!error
      })

    case actionTypes.TICK_RUN_TIME:
      return {...state, runTime: Date.now()}
  }

  return state
}
