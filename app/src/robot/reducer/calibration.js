// @flow
// robot calibration state and reducer
// TODO(mc, 2018-01-10): refactor to use combineReducers
import type {Mount, Slot, LabwareCalibrationStatus} from '../types'
import {actionTypes, type ConfirmProbedAction} from '../actions'

import {
  UNCONFIRMED,
  MOVING_TO_SLOT,
  OVER_SLOT,
  PICKING_UP,
  HOMING,
  HOMED,
  UPDATING,
  UPDATED,
  CONFIRMING,
  CONFIRMED,

  JOG_DISTANCE_SLOW_MM,
  JOG_DISTANCE_FAST_MM
} from '../constants'

// calibration request types
// TODO(mc, 2018-01-10): these should match up with the request actions;
//   explore how to link these concepts effectively
type CalibrationRequestType =
  | ''
  | 'MOVE_TO_FRONT'
  | 'PROBE_TIP'

type CalibrationRequest = {
  type: CalibrationRequestType,
  mount: Mount | '',
  inProgress: boolean,
  error: ?{message: string},
}

// TODO(mc, 2018-01-10): replace with CalibrationRequest
type LabwareConfirmationRequest = {
  inProgress: boolean,
  mount?: Mount | '',
  slot?: Slot | '',
  error: ?{message: string},
}

export type State = {
  deckPopulated: boolean,
  jogDistance: number,

  probedByMount: {[Mount]: boolean},

  labwareBySlot: {[Slot]: LabwareCalibrationStatus},
  confirmedBySlot: {[Slot]: boolean},

  calibrationRequest: CalibrationRequest,

  pickupRequest: LabwareConfirmationRequest,
  homeRequest: LabwareConfirmationRequest,
  confirmTiprackRequest: LabwareConfirmationRequest,
  moveToRequest: LabwareConfirmationRequest,
  jogRequest: LabwareConfirmationRequest,
  updateOffsetRequest: LabwareConfirmationRequest,
}

// TODO(mc, 2018-01-11): depecrate this once all robot actions typed
type Action =
  | {
      type: string,
      payload?: any,
      error?: boolean,
      meta?: {}
    }
  | ConfirmProbedAction

// TODO(mc, 2018-01-11): replace actionType constants with Flow types
const {
  SESSION,
  DISCONNECT_RESPONSE,
  SET_DECK_POPULATED,
  PICKUP_AND_HOME,
  PICKUP_AND_HOME_RESPONSE,
  DROP_TIP_AND_HOME,
  DROP_TIP_AND_HOME_RESPONSE,
  CONFIRM_TIPRACK,
  CONFIRM_TIPRACK_RESPONSE,
  MOVE_TO_FRONT,
  MOVE_TO_FRONT_RESPONSE,
  PROBE_TIP,
  PROBE_TIP_RESPONSE,
  MOVE_TO,
  MOVE_TO_RESPONSE,
  TOGGLE_JOG_DISTANCE,
  JOG,
  JOG_RESPONSE,
  UPDATE_OFFSET,
  UPDATE_OFFSET_RESPONSE,
  CONFIRM_LABWARE
} = actionTypes

const INITIAL_STATE: State = {
  deckPopulated: true,
  jogDistance: JOG_DISTANCE_SLOW_MM,

  probedByMount: {},

  // TODO(mc, 2017-11-07): labwareBySlot holds confirmation status by
  // slot. confirmedBySlot holds a flag for whether the labware has been
  // confirmed at least once. Rethink or combine these states
  labwareBySlot: {},
  confirmedBySlot: {},

  calibrationRequest: {type: '', inProgress: false, mount: '', error: null},

  // TODO(mc, 2017-11-22): collapse all these into a single
  // instrumentRequest object. We can't have simultaneous instrument
  // movements so split state hurts us without benefit
  pickupRequest: {inProgress: false, error: null, slot: ''},
  homeRequest: {inProgress: false, error: null, slot: ''},
  confirmTiprackRequest: {inProgress: false, error: null, slot: ''},
  moveToRequest: {inProgress: false, error: null},
  jogRequest: {inProgress: false, error: null},
  updateOffsetRequest: {inProgress: false, error: null}
}

export default function calibrationReducer (
  state: State = INITIAL_STATE,
  action: Action
): State {
  switch (action.type) {
    case 'robot:CONFIRM_PROBED': return handleConfirmProbed(state, action)
    case DISCONNECT_RESPONSE: return handleDisconnectResponse(state, action)
    case SESSION: return handleSession(state, action)
    case SET_DECK_POPULATED: return handleSetDeckPopulated(state, action)
    case MOVE_TO_FRONT: return handleMoveToFront(state, action)
    case MOVE_TO_FRONT_RESPONSE: return handleMoveToFrontResponse(state, action)
    case PICKUP_AND_HOME: return handlePickupAndHome(state, action)
    case PICKUP_AND_HOME_RESPONSE:
      return handlePickupAndHomeResponse(state, action)
    case DROP_TIP_AND_HOME: return handleHomeInstrument(state, action)
    case DROP_TIP_AND_HOME_RESPONSE:
      return handleHomeInstrumentResponse(state, action)
    case CONFIRM_TIPRACK: return handleConfirmTiprack(state, action)
    case CONFIRM_TIPRACK_RESPONSE: return handleConfirmTiprackResponse(state, action)
    case PROBE_TIP: return handleProbeTip(state, action)
    case PROBE_TIP_RESPONSE: return handleProbeTipResponse(state, action)
    case MOVE_TO: return handleMoveTo(state, action)
    case MOVE_TO_RESPONSE: return handleMoveToResponse(state, action)
    case TOGGLE_JOG_DISTANCE: return handleToggleJog(state, action)
    case JOG: return handleJog(state, action)
    case JOG_RESPONSE: return handleJogResponse(state, action)
    case UPDATE_OFFSET: return handleUpdateOffset(state, action)
    case UPDATE_OFFSET_RESPONSE: return handleUpdateResponse(state, action)
    case CONFIRM_LABWARE: return handleConfirmLabware(state, action)
  }

  return state
}

function handleDisconnectResponse (state, action) {
  if (action.error) return state
  return INITIAL_STATE
}

function handleSession (state, action) {
  return INITIAL_STATE
}

function handleSetDeckPopulated (state, action) {
  return {...state, deckPopulated: action.payload}
}

function handleMoveToFront (state, action) {
  if (!action.payload || !action.payload.instrument) return state

  const {payload: {instrument}} = action

  return {
    ...state,
    deckPopulated: false,
    calibrationRequest: {
      type: 'MOVE_TO_FRONT',
      mount: instrument,
      inProgress: true,
      error: null
    }
  }
}

function handleMoveToFrontResponse (state, action) {
  const {payload, error} = action

  return {
    ...state,
    calibrationRequest: {
      ...state.calibrationRequest,
      inProgress: false,
      error: error
        ? payload
        : null
    }
  }
}

function handleProbeTip (state, action) {
  if (!action.payload || !action.payload.instrument) return state

  const {payload: {instrument}} = action

  return {
    ...state,
    calibrationRequest: {
      type: 'PROBE_TIP',
      mount: instrument,
      inProgress: true,
      error: null
    },
    probedByMount: {
      ...state.probedByMount,
      [instrument]: false
    }
  }
}

function handleProbeTipResponse (state, action) {
  const {payload, error} = action

  return {
    ...state,
    calibrationRequest: {
      ...state.calibrationRequest,
      inProgress: false,
      error: error
        ? payload
        : null
    }
  }
}

// TODO(mc, 2018-01-23): change Action to ConfirmProbedAction when able
function handleConfirmProbed (state: State, action: Action): State {
  // TODO(mc, 2018-01-23): remove when actions are fully typed
  if (action.payload !== 'left' && action.payload !== 'right') return state

  return {
    ...state,
    probedByMount: {...state.probedByMount, [action.payload]: true}
  }
}

function handleMoveTo (state, action) {
  if (!action.payload || !action.payload.labware) return state

  const {payload: {labware: slot}} = action

  return {
    ...state,
    deckPopulated: true,
    moveToRequest: {inProgress: true, error: null, slot},
    labwareBySlot: {...state.labwareBySlot, [slot]: MOVING_TO_SLOT}
  }
}

function handleMoveToResponse (state, action) {
  const {moveToRequest: {slot}} = state
  if (!slot) return state

  const {payload, error} = action

  return {
    ...state,
    moveToRequest: {
      ...state.moveToRequest,
      inProgress: false,
      error: error
        ? payload
        : null
    },
    labwareBySlot: {
      ...state.labwareBySlot,
      [slot]: !error
        ? OVER_SLOT
        : UNCONFIRMED
    }
  }
}

// TODO(mc, 2017-11-22): collapse all these calibration handlers into one
// See state TODO above
function handlePickupAndHome (state, action) {
  if (!action.payload || !action.payload.labware) return state

  const {payload: {labware: slot}} = action

  return {
    ...state,
    deckPopulated: true,
    pickupRequest: {inProgress: true, error: null, slot},
    labwareBySlot: {...state.labwareBySlot, [slot]: PICKING_UP}
  }
}

function handlePickupAndHomeResponse (state, action) {
  const {pickupRequest: {slot}} = state
  if (!slot) return state

  const {payload, error} = action

  return {
    ...state,
    pickupRequest: {
      ...state.pickupRequest,
      inProgress: false,
      error: error
        ? payload
        : null
    },
    labwareBySlot: {
      ...state.labwareBySlot,
      [slot]: error
        ? UNCONFIRMED
        : HOMED
    }
  }
}

function handleHomeInstrument (state, action) {
  if (!action.payload || !action.payload.labware) return state

  const {payload: {labware: slot}} = action

  return {
    ...state,
    homeRequest: {inProgress: true, error: null, slot},
    labwareBySlot: {...state.labwareBySlot, [slot]: HOMING}
  }
}

function handleHomeInstrumentResponse (state, action) {
  const {homeRequest: {slot}} = state
  if (!slot) return state

  const {payload, error} = action

  return {
    ...state,
    homeRequest: {
      ...state.homeRequest,
      inProgress: false,
      error: error
        ? payload
        : null
    },
    labwareBySlot: {
      ...state.labwareBySlot,
      [slot]: error
        ? UNCONFIRMED
        : HOMED
    }
  }
}

function handleConfirmTiprack (state, action) {
  if (!action.payload || !action.payload.labware) return state

  const {payload: {labware: slot}} = action

  return {
    ...state,
    confirmTiprackRequest: {inProgress: true, error: null, slot},
    labwareBySlot: {...state.labwareBySlot, [slot]: CONFIRMING}
  }
}

function handleConfirmTiprackResponse (state, action) {
  const {confirmTiprackRequest: {slot}} = state
  if (!slot) return state

  const {payload, error} = action

  return {
    ...state,
    confirmTiprackRequest: {
      ...state.confirmTiprackRequest,
      inProgress: false,
      error: error
        ? payload
        : null
    },
    labwareBySlot: {
      ...state.labwareBySlot,
      [slot]: error
        ? UNCONFIRMED
        : CONFIRMED
    },
    confirmedBySlot: {
      ...state.confirmedBySlot,
      [slot]: !error
    }
  }
}

function handleToggleJog (state, action) {
  return {
    ...state,
    jogDistance: state.jogDistance === JOG_DISTANCE_SLOW_MM
      ? JOG_DISTANCE_FAST_MM
      : JOG_DISTANCE_SLOW_MM
  }
}

function handleJog (state, action) {
  return {...state, jogRequest: {inProgress: true, error: null}}
}

function handleJogResponse (state, action) {
  const {payload, error} = action

  return {
    ...state,
    jogRequest: {
      inProgress: false,
      error: error
        ? payload
        : null
    }
  }
}

function handleUpdateOffset (state, action) {
  if (!action.payload || !action.payload.labware) return state

  const {payload: {labware: slot}} = action

  return {
    ...state,
    updateOffsetRequest: {inProgress: true, error: null, slot},
    labwareBySlot: {
      ...state.labwareBySlot,
      [slot]: UPDATING
    }
  }
}

function handleUpdateResponse (state, action) {
  const {updateOffsetRequest: {slot}} = state
  if (!slot) return state

  const {error, payload} = action
  let labwareBySlot = {...state.labwareBySlot}
  let confirmedBySlot = {...state.confirmedBySlot}

  // set status and confirmed flag for non-tipracks
  // tipracks are handled by confirmTiprack so we don't want to touch them here
  if (payload && !payload.isTiprack) {
    confirmedBySlot[slot] = !error
    labwareBySlot[slot] = !error
      ? CONFIRMED
      : UNCONFIRMED
  } else {
    labwareBySlot[slot] = !error
      ? UPDATED
      : UNCONFIRMED
  }

  return {
    ...state,
    labwareBySlot,
    confirmedBySlot,
    updateOffsetRequest: {
      ...state.updateOffsetRequest,
      inProgress: false,
      error: error
        ? payload
        : null
    }
  }
}

function handleConfirmLabware (state, action) {
  if (!action.payload || !action.payload.labware) return state

  const {payload: {labware: slot}} = action

  return {
    ...state,
    labwareBySlot: {...state.labwareBySlot, [slot]: CONFIRMED},
    confirmedBySlot: {...state.confirmedBySlot, [slot]: true}
  }
}
