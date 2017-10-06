// robot reducer
// TODO(mc, 2017-10-05): Split into sub-reducers or different redux modules
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
  // TODO(mc, 2017-10-06): currentInstrumentCalibration and currentLabware-
  // Confirmation are not well thought out; fix when API state is expanded
  instrumentCalibrationByAxis: {},
  labwareConfirmationBySlot: {},
  currentInstrument: '',
  currentInstrumentCalibration: {
    axis: '',
    isPreparingForProbe: false,
    isReadyForProbe: false,
    isProbing: false
  },
  labwareReviewed: false,
  currentLabware: 0,
  currentLabwareConfirmation: {
    slot: 0,
    isMoving: false,
    isOverWell: false
  },

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
      instrumentCalibrationByAxis,
      currentInstrument
    } = selectors.getState(allState)

    return constants.INSTRUMENT_AXES.map((axis) => {
      const instrument = protocolInstrumentsByAxis[axis] || {axis}
      const calibration = instrumentCalibrationByAxis[axis] || {isProbed: false}

      if (instrument.channels === 1) {
        instrument.channels = constants.SINGLE_CHANNEL
      } else if (instrument.channels > 1) {
        instrument.channels = constants.MULTI_CHANNEL
      }

      return {
        ...instrument,
        ...calibration,
        isCurrent: axis === currentInstrument
      }
    })
  },

  getCurrentInstrument (allState) {
    return selectors.getInstruments(allState).find((i) => i.isCurrent)
  },

  getInstrumentsCalibrated (allState) {
    const instruments = selectors.getInstruments(allState)

    return instruments.every((i) => i.name == null || i.isProbed)
  },

  getCurrentInstrumentCalibration (allState) {
    const state = selectors.getState(allState)

    return state.currentInstrumentCalibration
  },

  getLabware (allState) {
    const {
      protocolLabwareBySlot,
      labwareConfirmationBySlot,
      currentLabware
    } = selectors.getState(allState)

    return constants.DECK_SLOTS.map((slot) => {
      const labware = protocolLabwareBySlot[slot] || {slot}
      const confirmation = labwareConfirmationBySlot[slot] || {}

      return {...labware, ...confirmation, isCurrent: currentLabware === slot}
    })
  },

  getLabwareReviewed (allState) {
    return selectors.getState(allState).labwareReviewed
  },

  getCurrentLabware (allState) {
    return selectors.getLabware(allState).find((lw) => lw.isCurrent)
  },

  getTipracks (allState) {
    return selectors.getLabware(allState).filter((lw) => lw.isTiprack)
  },

  getTipracksConfirmed (allState) {
    return selectors.getTipracks(allState).every((t) => t.isConfirmed)
  },

  getLabwareConfirmed (allState) {
    return selectors.getLabware(allState)
      .every((t) => t.name == null || t.isConfirmed)
  },

  getCurrentLabwareConfirmation (allState) {
    return selectors.getState(allState).currentLabwareConfirmation
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
        sessionName: payload.file.name,
        labwareReviewed: false
      })

    case actionTypes.SESSION_RESPONSE:
      return handleResponse(state, 'sessionRequest', error, payload.session)

    case actionTypes.HOME:
      return handleRequest(state, 'homeRequest', error)

    case actionTypes.HOME_RESPONSE:
      return handleResponse(state, 'homeRequest', error)

    case actionTypes.SET_CURRENT_INSTRUMENT:
      return {...state, currentInstrument: payload.instrument}

    case actionTypes.SET_CURRENT_LABWARE:
      return {...state, currentLabware: payload.labware}

    case actionTypes.SET_LABWARE_REVIEWED:
      return {...state, labwareReviewed: true}

    case actionTypes.MOVE_TO_FRONT:
      return handleRequest(state, 'moveToFrontRequest', errorPayload, {
        instrumentCalibrationByAxis: {
          ...state.instrumentCalibrationByAxis,
          [payload.instrument]: {isProbed: false}
        },
        currentInstrumentCalibration: {
          ...state.currentInstrumentCalibration,
          axis: payload.instrument,
          isPreparingForProbe: true
        }
      })

    case actionTypes.MOVE_TO_FRONT_RESPONSE:
      return handleResponse(state, 'moveToFrontRequest', errorPayload, {
        currentInstrumentCalibration: {
          ...state.currentInstrumentCalibration,
          isPreparingForProbe: false,
          isReadyForProbe: !error
        }
      })

    case actionTypes.PROBE_TIP:
      return handleRequest(state, 'probeTipRequest', errorPayload, {
        currentInstrumentCalibration: {
          ...state.currentInstrumentCalibration,
          axis: payload.instrument,
          isReadyForProbe: false,
          isProbing: true
        }
      })

    case actionTypes.PROBE_TIP_RESPONSE:
      return handleResponse(state, 'probeTipRequest', errorPayload, {
        currentInstrumentCalibration: {
          ...state.currentInstrumentCalibration,
          isProbing: false
        },
        instrumentCalibrationByAxis: {
          ...state.instrumentCalibrationByAxis,
          [state.currentInstrumentCalibration.axis]: {isProbed: !error}
        }
      })

    case actionTypes.MOVE_TO:
      return handleRequest(state, 'moveToRequest', errorPayload, {
        currentLabwareConfirmation: {
          ...state.currentLabwareConfirmation,
          slot: payload.labware,
          isMoving: true,
          isOverWell: false
        }
      })

    case actionTypes.MOVE_TO_RESPONSE:
      return handleResponse(state, 'moveToRequest', errorPayload, {
        currentLabwareConfirmation: {
          ...state.currentLabwareConfirmation,
          isMoving: false,
          isOverWell: !error
        }
      })

    case actionTypes.JOG:
      return handleRequest(state, 'jogRequest', errorPayload)

    case actionTypes.JOG_RESPONSE:
      return handleResponse(state, 'jogRequest', errorPayload)

    case actionTypes.UPDATE_OFFSET:
      return handleRequest(state, 'updateOffsetRequest', errorPayload)

    case actionTypes.UPDATE_OFFSET_RESPONSE:
      return handleResponse(state, 'updateOffsetRequest', errorPayload, {
        labwareConfirmationBySlot: {
          ...state.labwareConfirmationBySlot,
          [state.currentLabwareConfirmation.slot]: {isConfirmed: true}
        },
        currentLabwareConfirmation: {
          slot: 0,
          isMoving: false,
          isOverWell: false
        }
      })

    case actionTypes.SET_LABWARE_CONFIRMED:
      return {
        ...state,
        labwareConfirmationBySlot: {
          ...state.labwareConfirmationBySlot,
          [payload.labware]: {isConfirmed: true}
        },
        currentLabwareConfirmation: {
          slot: 0,
          isMoving: false,
          isOverWell: false
        }
      }

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
