// @flow
// robot calibration state and reducer
// TODO(mc, 2018-01-10): refactor to use combineReducers
import mapValues from 'lodash/mapValues'

import type {Mount, Slot, LabwareCalibrationStatus} from '../types'
import {actionTypes} from '../actions'
import type {
  Action,
  ConfirmProbedAction,
  LabwareCalibrationAction,
  CalibrationResponseAction
} from '../actions'

import {
  DECK_SLOTS,

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
  | 'PICKUP_AND_HOME'
  | 'DROP_TIP_AND_HOME'
  | 'CONFIRM_TIPRACK'
  | 'UPDATE_OFFSET'

type CalibrationRequest = {
  type: CalibrationRequestType,
  mount?: Mount,
  slot?: Slot,
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
  tipOnByMount: {[Mount]: boolean},

  labwareBySlot: {[Slot]: LabwareCalibrationStatus},
  confirmedBySlot: {[Slot]: boolean},

  calibrationRequest: CalibrationRequest,

  moveToRequest: LabwareConfirmationRequest,
  jogRequest: LabwareConfirmationRequest,
  updateOffsetRequest: LabwareConfirmationRequest,
}

// TODO(mc, 2018-01-11): replace actionType constants with Flow types
const {
  SESSION,
  DISCONNECT_RESPONSE,
  SET_DECK_POPULATED,
  MOVE_TO_FRONT,
  MOVE_TO_FRONT_RESPONSE,
  PROBE_TIP,
  PROBE_TIP_RESPONSE,
  MOVE_TO,
  MOVE_TO_RESPONSE,
  TOGGLE_JOG_DISTANCE,
  JOG,
  JOG_RESPONSE,
  CONFIRM_LABWARE
} = actionTypes

const INITIAL_STATE: State = {
  deckPopulated: true,
  jogDistance: JOG_DISTANCE_SLOW_MM,

  // TODO(mc, 2018-01-22): combine these into subreducer
  probedByMount: {},
  tipOnByMount: {},

  // TODO(mc, 2017-11-07): labwareBySlot holds confirmation status by
  // slot. confirmedBySlot holds a flag for whether the labware has been
  // confirmed at least once. Rethink or combine these states
  labwareBySlot: {},
  confirmedBySlot: {},

  calibrationRequest: {type: '', inProgress: false, error: null},

  // TODO(mc, 2017-11-22): collapse all these into a single
  // instrumentRequest object. We can't have simultaneous instrument
  // movements so split state hurts us without benefit
  moveToRequest: {inProgress: false, error: null},
  jogRequest: {inProgress: false, error: null},
  updateOffsetRequest: {inProgress: false, error: null}
}

export default function calibrationReducer (
  state: State = INITIAL_STATE,
  action: Action
): State {
  switch (action.type) {
    case 'robot:CONFIRM_PROBED':
      return handleConfirmProbed(state, action)

    case 'robot:PICKUP_AND_HOME':
      return handlePickupAndHome(state, action)

    case 'robot:PICKUP_AND_HOME_RESPONSE':
      return handlePickupAndHomeResponse(state, action)

    case 'robot:DROP_TIP_AND_HOME':
      return handleDropTipAndHome(state, action)

    case 'robot:DROP_TIP_AND_HOME_RESPONSE':
      return handleDropTipAndHomeResponse(state, action)

    case 'robot:CONFIRM_TIPRACK':
      return handleConfirmTiprack(state, action)

    case 'robot:CONFIRM_TIPRACK_RESPONSE':
      return handleConfirmTiprackResponse(state, action)

    case 'robot:UPDATE_OFFSET':
      return handleUpdateOffset(state, action)

    case 'robot:UPDATE_OFFSET_RESPONSE':
      return handleUpdateResponse(state, action)

    // TODO(mc, 20187-01-26): caution - not covered by flow yet
    case DISCONNECT_RESPONSE: return handleDisconnectResponse(state, action)
    case SESSION: return handleSession(state, action)
    case SET_DECK_POPULATED: return handleSetDeckPopulated(state, action)
    case MOVE_TO_FRONT: return handleMoveToFront(state, action)
    case MOVE_TO_FRONT_RESPONSE: return handleMoveToFrontResponse(state, action)
    case PROBE_TIP: return handleProbeTip(state, action)
    case PROBE_TIP_RESPONSE: return handleProbeTipResponse(state, action)
    case MOVE_TO: return handleMoveTo(state, action)
    case MOVE_TO_RESPONSE: return handleMoveToResponse(state, action)
    case TOGGLE_JOG_DISTANCE: return handleToggleJog(state, action)
    case JOG: return handleJog(state, action)
    case JOG_RESPONSE: return handleJogResponse(state, action)
    case CONFIRM_LABWARE: return handleConfirmLabware(state, action)
  }

  return state
}

function handleDisconnectResponse (state: State, action: any): State {
  if (action.error) return state
  return INITIAL_STATE
}

function handleSession (state: State, action: any): State {
  return INITIAL_STATE
}

function handleSetDeckPopulated (state: State, action: any): State {
  return {...state, deckPopulated: action.payload}
}

function handleMoveToFront (state: State, action: any): State {
  if (!action.payload || !action.payload.instrument) return state

  const {payload: {instrument: mount}} = action

  return {
    ...state,
    deckPopulated: false,
    calibrationRequest: {
      type: 'MOVE_TO_FRONT',
      inProgress: true,
      error: null,
      mount
    }
  }
}

function handleMoveToFrontResponse (state: State, action: any): State {
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

function handleProbeTip (state: State, action: any) {
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

function handleProbeTipResponse (state: State, action: any) {
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

function handleConfirmProbed (
  state: State,
  action: ConfirmProbedAction
): State {
  return {
    ...state,
    probedByMount: {...state.probedByMount, [action.payload]: true}
  }
}

function handleMoveTo (state: State, action: any) {
  if (!action.payload || !action.payload.labware) return state

  // TODO(mc, 2018-01-26): remove when MODE_TO is flow typed
  const slot = action.payload.labware
  if (DECK_SLOTS.indexOf(slot) < 0) return state

  return {
    ...state,
    deckPopulated: true,
    moveToRequest: {inProgress: true, error: null, slot},
    labwareBySlot: {...state.labwareBySlot, [slot]: MOVING_TO_SLOT}
  }
}

function handleMoveToResponse (state: State, action: any) {
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

function handlePickupAndHome (
  state: State,
  action: LabwareCalibrationAction
): State {
  const {payload: {mount, slot}} = action

  return {
    ...state,
    deckPopulated: true,
    calibrationRequest: {
      type: 'PICKUP_AND_HOME',
      inProgress: true,
      error: null,
      mount,
      slot
    },
    labwareBySlot: {...state.labwareBySlot, [slot]: PICKING_UP}
  }
}

function handlePickupAndHomeResponse (
  state: State,
  action: CalibrationResponseAction
): State {
  const {calibrationRequest: {mount, slot}} = state
  if (!slot || !mount) return state

  const {payload, error} = action

  // HACK(mc, 2018-01-26): fix after we separate success and failure actions
  let errorObject: ?Error = null
  if (typeof payload.message === 'string' && error) {
    errorObject = new Error(payload.message)
  }

  return {
    ...state,
    calibrationRequest: {
      ...state.calibrationRequest,
      inProgress: false,
      error: errorObject
    },
    // assume that only one tip can be on at a time
    tipOnByMount: {
      ...mapValues(state.tipOnByMount, (value: boolean, key: Mount) => false),
      [mount]: !error
    },
    labwareBySlot: {
      ...state.labwareBySlot,
      [slot]: error
        ? UNCONFIRMED
        : HOMED
    }
  }
}

function handleDropTipAndHome (
  state: State,
  action: LabwareCalibrationAction
): State {
  const {payload: {mount, slot}} = action

  return {
    ...state,
    calibrationRequest: {
      type: 'DROP_TIP_AND_HOME',
      inProgress: true,
      error: null,
      mount,
      slot
    },
    labwareBySlot: {...state.labwareBySlot, [slot]: HOMING}
  }
}

function handleDropTipAndHomeResponse (
  state: State,
  action: CalibrationResponseAction
): State {
  const {calibrationRequest: {mount, slot}} = state
  if (!slot || !mount) return state

  const {error, payload} = action

  // HACK(mc, 2018-01-26): fix after we separate success and failure actions
  let errorObject: ?Error = null
  if (error && typeof payload.message === 'string') {
    errorObject = new Error(payload.message)
  }

  return {
    ...state,
    calibrationRequest: {
      ...state.calibrationRequest,
      inProgress: false,
      error: errorObject
    },
    tipOnByMount: {
      ...state.tipOnByMount,
      [mount]: !!error
    },
    labwareBySlot: {
      ...state.labwareBySlot,
      [slot]: error
        ? UNCONFIRMED
        : HOMED
    }
  }
}

function handleConfirmTiprack (
  state: State,
  action: LabwareCalibrationAction
): State {
  const {payload: {mount, slot}} = action

  return {
    ...state,
    calibrationRequest: {
      type: 'CONFIRM_TIPRACK',
      inProgress: true,
      error: null,
      mount,
      slot
    },
    labwareBySlot: {...state.labwareBySlot, [slot]: CONFIRMING}
  }
}

function handleConfirmTiprackResponse (
  state: State,
  action: CalibrationResponseAction
): State {
  const {calibrationRequest: {mount, slot}} = state
  if (!slot || !mount) return state

  const {payload, error} = action

  // HACK(mc, 2018-01-26): fix after we separate success and failure actions
  let errorObject: ?Error = null
  let tipOn: boolean = state.tipOnByMount[mount] || false
  if (typeof payload.message === 'string' && error) {
    errorObject = new Error(payload.message)
  } else if (typeof payload.tipOn === 'boolean') {
    tipOn = payload.tipOn
  }

  return {
    ...state,
    calibrationRequest: {
      ...state.calibrationRequest,
      inProgress: false,
      error: errorObject
    },
    tipOnByMount: {
      ...state.tipOnByMount,
      [mount]: tipOn
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

function handleToggleJog (state: State, action: any) {
  return {
    ...state,
    jogDistance: state.jogDistance === JOG_DISTANCE_SLOW_MM
      ? JOG_DISTANCE_FAST_MM
      : JOG_DISTANCE_SLOW_MM
  }
}

function handleJog (state: State, action: any) {
  return {...state, jogRequest: {inProgress: true, error: null}}
}

function handleJogResponse (state: State, action: any) {
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

function handleUpdateOffset (
  state: State,
  action: LabwareCalibrationAction
): State {
  const {payload: {mount, slot}} = action

  return {
    ...state,
    calibrationRequest: {
      type: 'UPDATE_OFFSET',
      inProgress: true,
      error: null,
      mount,
      slot
    },
    labwareBySlot: {
      ...state.labwareBySlot,
      [slot]: UPDATING
    }
  }
}

function handleUpdateResponse (
  state: State,
  action: CalibrationResponseAction
): State {
  const {calibrationRequest: {mount, slot}} = state
  if (!mount || !slot) return state

  const {error, payload} = action
  let labwareBySlot = {...state.labwareBySlot}
  let confirmedBySlot = {...state.confirmedBySlot}
  let tipOnByMount = {...state.tipOnByMount}

  // HACK(mc, 2018-01-26): fix after we separate success and failure actions
  let errorObject: ?Error = null
  let isTiprack: boolean = false
  if (typeof payload.message === 'string' && error) {
    errorObject = new Error(payload.message)
  } else if (typeof payload.isTiprack === 'boolean') {
    isTiprack = payload.isTiprack
  }

  // set status and confirmed flag for non-tipracks
  // tipracks are handled by confirmTiprack so we don't want to touch them here
  if (isTiprack) {
    tipOnByMount[mount] = !error
    labwareBySlot[slot] = !error
      ? UPDATED
      : UNCONFIRMED
  } else {
    confirmedBySlot[slot] = !error
    labwareBySlot[slot] = !error
      ? CONFIRMED
      : UNCONFIRMED
  }

  return {
    ...state,
    calibrationRequest: {
      ...state.calibrationRequest,
      inProgress: false,
      error: errorObject
    },
    tipOnByMount,
    labwareBySlot,
    confirmedBySlot
  }
}

function handleConfirmLabware (state, action: any) {
  if (!action.payload || !action.payload.labware) return state

  const {payload: {labware: slot}} = action

  return {
    ...state,
    labwareBySlot: {...state.labwareBySlot, [slot]: CONFIRMED},
    confirmedBySlot: {...state.confirmedBySlot, [slot]: true}
  }
}
