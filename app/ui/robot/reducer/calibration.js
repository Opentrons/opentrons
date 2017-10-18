// robot calibration state and reducer
import {actionTypes} from '../actions'

import {
  UNPROBED,
  PREPARING_TO_PROBE,
  READY_TO_PROBE,
  PROBING,
  PROBED,

  UNCONFIRMED,
  MOVING_TO_SLOT,
  OVER_SLOT,
  CONFIRMED
} from '../constants'

const {
  SESSION,
  DISCONNECT_RESPONSE,
  SET_LABWARE_REVIEWED,
  // TODO(mc, 2017-10-17): implement home when api.calibration_manager can home
  // HOME,
  // HOME_RESPONSE,
  MOVE_TO_FRONT,
  MOVE_TO_FRONT_RESPONSE,
  PROBE_TIP,
  PROBE_TIP_RESPONSE,
  MOVE_TO,
  MOVE_TO_RESPONSE,
  JOG,
  JOG_RESPONSE,
  UPDATE_OFFSET,
  UPDATE_OFFSET_RESPONSE,
  CONFIRM_LABWARE
} = actionTypes

const INITIAL_STATE = {
  labwareReviewed: false,
  instrumentsByAxis: {},
  labwareBySlot: {},

  // homeRequest: {inProgress: false, error: null},
  moveToFrontRequest: {inProgress: false, error: null},
  probeTipRequest: {inProgress: false, error: null},
  moveToRequest: {inProgress: false, error: null},
  jogRequest: {inProgress: false, error: null},
  updateOffsetRequest: {inProgress: false, error: null}
}

export default function calibrationReducer (state = INITIAL_STATE, action) {
  switch (action.type) {
    case DISCONNECT_RESPONSE: return handleDisconnectResponse(state, action)
    case SESSION: return handleSession(state, action)
    case SET_LABWARE_REVIEWED: return handleSetLabwareReviewed(state, action)
    case MOVE_TO_FRONT: return handleMoveToFront(state, action)
    case MOVE_TO_FRONT_RESPONSE: return handleMoveToFrontResponse(state, action)
    case PROBE_TIP: return handleProbeTip(state, action)
    case PROBE_TIP_RESPONSE: return handleProbeTipResponse(state, action)
    case MOVE_TO: return handleMoveTo(state, action)
    case MOVE_TO_RESPONSE: return handleMoveToResponse(state, action)
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

function handleSetLabwareReviewed (state, action) {
  return {...state, labwareReviewed: action.payload}
}

// TODO(mc, 2017-10-17): probe tip should clear out any unprobed axes
function handleMoveToFront (state, action) {
  const {payload: {instrument: axis}} = action

  return {
    ...state,
    moveToFrontRequest: {inProgress: true, error: null, axis},
    instrumentsByAxis: {...state.instrumentsByAxis, [axis]: PREPARING_TO_PROBE}
  }
}

function handleMoveToFrontResponse (state, action) {
  const {moveToFrontRequest: {axis}} = state
  const {payload, error} = action

  return {
    ...state,
    moveToFrontRequest: {
      ...state.moveToFrontRequest,
      inProgress: false,
      error: error
        ? payload
        : null
    },
    instrumentsByAxis: {
      ...state.instrumentsByAxis,
      [axis]: !error
        ? READY_TO_PROBE
        : UNPROBED
    }
  }
}

// TODO(mc, 2017-10-17): probe tip should clear out any unprobed axes
function handleProbeTip (state, action) {
  const {payload: {instrument: axis}} = action

  return {
    ...state,
    probeTipRequest: {inProgress: true, error: null, axis},
    instrumentsByAxis: {...state.instrumentsByAxis, [axis]: PROBING}
  }
}

function handleProbeTipResponse (state, action) {
  const {probeTipRequest: {axis}} = state
  const {payload, error} = action

  return {
    ...state,
    probeTipRequest: {
      ...state.probeTipRequest,
      inProgress: false,
      error: error
        ? payload
        : null
    },
    instrumentsByAxis: {
      ...state.instrumentsByAxis,
      [axis]: !error
        ? PROBED
        : UNPROBED
    }
  }
}

function handleMoveTo (state, action) {
  const {payload: {labware: slot}} = action

  return {
    ...state,
    labwareReviewed: true,
    moveToRequest: {inProgress: true, error: null, slot},
    labwareBySlot: {...state.labwareBySlot, [slot]: MOVING_TO_SLOT}
  }
}

function handleMoveToResponse (state, action) {
  const {moveToRequest: {slot}} = state
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
  const {payload: {labware: slot}} = action

  return {...state, updateOffsetRequest: {inProgress: true, error: null, slot}}
}

function handleUpdateResponse (state, action) {
  const {updateOffsetRequest: {slot}} = state
  const {error, payload} = action

  return {
    ...state,
    updateOffsetRequest: {
      ...state.updateOffsetRequest,
      inProgress: false,
      error: error
        ? payload
        : null
    },
    labwareBySlot: {
      ...state.labwareBySlot,
      [slot]: !error
        ? CONFIRMED
        : OVER_SLOT
    }
  }
}

function handleConfirmLabware (state, action) {
  const {payload: {labware: slot}} = action

  return {...state, labwareBySlot: {...state.labwareBySlot, [slot]: CONFIRMED}}
}
