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
  PICKING_UP,
  HOMING,
  HOMED,
  CONFIRMING,
  CONFIRMED,

  JOG_DISTANCE_SLOW_MM,
  JOG_DISTANCE_FAST_MM
} from '../constants'

const {
  SESSION,
  DISCONNECT_RESPONSE,
  SET_LABWARE_REVIEWED,
  PICKUP_AND_HOME,
  PICKUP_AND_HOME_RESPONSE,
  HOME_INSTRUMENT,
  HOME_INSTRUMENT_RESPONSE,
  CONFIRM_TIPRACK,
  CONFIRM_TIPRACK_RESPONSE,
  MOVE_TO_FRONT,
  MOVE_TO_FRONT_RESPONSE,
  PROBE_TIP,
  PROBE_TIP_RESPONSE,
  RESET_TIP_PROBE,
  MOVE_TO,
  MOVE_TO_RESPONSE,
  TOGGLE_JOG_DISTANCE,
  JOG,
  JOG_RESPONSE,
  UPDATE_OFFSET,
  UPDATE_OFFSET_RESPONSE,
  CONFIRM_LABWARE
} = actionTypes

const INITIAL_STATE = {
  labwareReviewed: false,
  jogDistance: JOG_DISTANCE_SLOW_MM,

  // TODO(mc, 2017-11-03): instrumentsByAxis holds calibration status by
  // axis. probedByAxis holds a flag for whether the instrument has been
  // probed at least once by axis. Rethink or combine these states
  instrumentsByAxis: {},
  probedByAxis: {},

  // TODO(mc, 2017-11-07): labwareBySlot holds confirmation status by
  // slot. confirmedBySlot holds a flag for whether the labware has been
  // confirmed at least once. Rethink or combine these states
  labwareBySlot: {},
  confirmedBySlot: {},

  // TODO(mc, 2017-11-22): collapse all these into a single
  // instrumentRequest object. We can't have simultaneous instrument
  // movements so split state hurts us without benefit
  pickupRequest: {inProgress: false, error: null, slot: 0},
  homeRequest: {inProgress: false, error: null, slot: 0},
  confirmTiprackRequest: {inProgress: false, error: null, slot: 0},
  moveToFrontRequest: {inProgress: false, error: null, axis: ''},
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
    case PICKUP_AND_HOME: return handlePickupAndHome(state, action)
    case PICKUP_AND_HOME_RESPONSE:
      return handlePickupAndHomeResponse(state, action)
    case HOME_INSTRUMENT: return handleHomeInstrument(state, action)
    case HOME_INSTRUMENT_RESPONSE:
      return handleHomeInstrumentResponse(state, action)
    case CONFIRM_TIPRACK: return handleConfirmTiprack(state, action)
    case CONFIRM_TIPRACK_RESPONSE: return handleConfirmTiprackResponse(state, action)
    case PROBE_TIP: return handleProbeTip(state, action)
    case PROBE_TIP_RESPONSE: return handleProbeTipResponse(state, action)
    case RESET_TIP_PROBE: return handleResetTipProbe(state, action)
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

function handleSetLabwareReviewed (state, action) {
  return {...state, labwareReviewed: action.payload}
}

function handleMoveToFront (state, action) {
  const {payload: {instrument: axis}} = action
  const instrumentsByAxis = Object.keys(state.instrumentsByAxis)
    .filter((targetAxis) => targetAxis !== axis)
    .reduce((calibration, targetAxis) => {
      calibration[targetAxis] = UNPROBED
      return calibration
    }, {
      ...state.instrumentsByAxis,
      [axis]: PREPARING_TO_PROBE
    })

  return {
    ...state,
    instrumentsByAxis,
    moveToFrontRequest: {inProgress: true, error: null, axis}
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
    },
    probedByAxis: {
      ...state.probedByAxis,
      [axis]: state.probedByAxis[axis] || !error
    }
  }
}

function handleResetTipProbe (state, action) {
  const {payload: {instrument: axis}} = action

  return {
    ...state,
    instrumentsByAxis: {...state.instrumentsByAxis, [axis]: UNPROBED}
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

// TODO(mc, 2017-11-22): collapse all these calibration handlers into one
// See state TODO above
function handlePickupAndHome (state, action) {
  const {payload: {labware: slot}} = action

  return {
    ...state,
    pickupRequest: {inProgress: true, error: null, slot},
    labwareBySlot: {...state.labwareBySlot, [slot]: PICKING_UP}
  }
}

function handlePickupAndHomeResponse (state, action) {
  const {pickupRequest: {slot}} = state
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
  const {payload: {labware: slot}} = action

  return {
    ...state,
    homeRequest: {inProgress: true, error: null, slot},
    labwareBySlot: {...state.labwareBySlot, [slot]: HOMING}
  }
}

function handleHomeInstrumentResponse (state, action) {
  const {homeRequest: {slot}} = state
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
  const {payload: {labware: slot}} = action

  return {
    ...state,
    confirmTiprackRequest: {inProgress: true, error: null, slot},
    labwareBySlot: {...state.labwareBySlot, [slot]: CONFIRMING}
  }
}

function handleConfirmTiprackResponse (state, action) {
  const {confirmTiprackRequest: {slot}} = state
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
  const {payload: {labware: slot}} = action

  return {...state, updateOffsetRequest: {inProgress: true, error: null, slot}}
}

function handleUpdateResponse (state, action) {
  const {updateOffsetRequest: {slot}} = state
  const {error, payload} = action
  let labwareBySlot = {...state.labwareBySlot}
  let confirmedBySlot = {...state.confirmedBySlot}

  // set status and confirmed flag for non-tipracks
  // tipracks are handled by confirmTiprack so we don't want to touch them here
  if (!payload.isTiprack) {
    confirmedBySlot[slot] = !error
    labwareBySlot[slot] = !error
      ? CONFIRMED
      : OVER_SLOT
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
  const {payload: {labware: slot}} = action

  return {
    ...state,
    labwareBySlot: {...state.labwareBySlot, [slot]: CONFIRMED},
    confirmedBySlot: {...state.confirmedBySlot, [slot]: true}
  }
}
