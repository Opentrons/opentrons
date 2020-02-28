// @flow
// robot calibration state and reducer
// TODO(mc, 2018-01-10): refactor to use combineReducers
import mapValues from 'lodash/mapValues'

import type { Action, Error } from '../../types'
import { HOME } from '../../robot-controls'
import type { Mount, Slot } from '../types'
import { actionTypes } from '../actions'
import type {
  ConfirmProbedAction,
  PipetteCalibrationAction,
  LabwareCalibrationAction,
  CalibrationSuccessAction,
  CalibrationFailureAction,
  SetModulesReviewedAction,
  ReturnTipResponseAction,
  ReturnTipAction,
} from '../actions'

// calibration request types
// TODO(mc, 2018-01-10): these should match up with the request actions;
//   explore how to link these concepts effectively
type CalibrationRequestType =
  | ''
  | 'MOVE_TO_FRONT'
  | 'PROBE_TIP'
  | 'MOVE_TO'
  | 'JOG'
  | 'PICKUP_AND_HOME'
  | 'DROP_TIP_AND_HOME'
  | 'CONFIRM_TIPRACK'
  | 'UPDATE_OFFSET'
  | 'SET_MODULES_REVIEWED'
  | 'RETURN_TIP'

type CalibrationRequest = $ReadOnly<{|
  type: CalibrationRequestType,
  mount?: Mount,
  slot?: Slot,
  inProgress: boolean,
  error: Error | null,
|}>

export type CalibrationState = $ReadOnly<{|
  deckPopulated: ?boolean,
  modulesReviewed: ?boolean,

  probedByMount: { [Mount]: boolean },
  tipOnByMount: { [Mount]: boolean },

  confirmedBySlot: { [Slot]: boolean },

  calibrationRequest: CalibrationRequest,
|}>

// TODO(mc, 2018-01-11): replace actionType constants with Flow types
const {
  SET_DECK_POPULATED,
  MOVE_TO_FRONT,
  MOVE_TO_FRONT_RESPONSE,
  PROBE_TIP,
  PROBE_TIP_RESPONSE,
  CONFIRM_LABWARE,
} = actionTypes

const INITIAL_STATE: CalibrationState = {
  deckPopulated: null,
  modulesReviewed: null,

  // TODO(mc, 2018-01-22): combine these into subreducer
  probedByMount: {},
  tipOnByMount: {},

  confirmedBySlot: {},

  calibrationRequest: { type: '', inProgress: false, error: null },
}

export function calibrationReducer(
  state: CalibrationState = INITIAL_STATE,
  action: Action
): CalibrationState {
  switch (action.type) {
    case 'robot:DISCONNECT_RESPONSE':
    case 'robot:REFRESH_SESSION':
    case 'protocol:UPLOAD':
      return INITIAL_STATE

    // reset calibration state on robot home
    case HOME:
    case 'robot:CLEAR_CALIBRATION_REQUEST':
      return {
        ...state,
        calibrationRequest: { type: '', inProgress: false, error: null },
      }

    case 'robot:CONFIRM_PROBED':
      return handleConfirmProbed(state, action)

    case 'robot:MOVE_TO':
      return handleMoveTo(state, action)

    case 'robot:MOVE_TO_SUCCESS':
      return handleMoveToSuccess(state, action)

    case 'robot:MOVE_TO_FAILURE':
      return handleMoveToFailure(state, action)

    case 'robot:JOG':
      return handleJog(state, action)

    case 'robot:JOG_SUCCESS':
      return handleJogSuccess(state, action)

    case 'robot:JOG_FAILURE':
      return handleJogFailure(state, action)

    case 'robot:PICKUP_AND_HOME':
      return handlePickupAndHome(state, action)

    case 'robot:PICKUP_AND_HOME_SUCCESS':
      return handlePickupAndHomeSuccess(state, action)

    case 'robot:PICKUP_AND_HOME_FAILURE':
      return handlePickupAndHomeFailure(state, action)

    case 'robot:DROP_TIP_AND_HOME':
      return handleDropTipAndHome(state, action)

    case 'robot:DROP_TIP_AND_HOME_SUCCESS':
      return handleDropTipAndHomeSuccess(state, action)

    case 'robot:DROP_TIP_AND_HOME_FAILURE':
      return handleDropTipAndHomeFailure(state, action)

    case 'robot:CONFIRM_TIPRACK':
      return handleConfirmTiprack(state, action)

    case 'robot:CONFIRM_TIPRACK_SUCCESS':
      return handleConfirmTiprackSuccess(state, action)

    case 'robot:CONFIRM_TIPRACK_FAILURE':
      return handleConfirmTiprackFailure(state, action)

    case 'robot:UPDATE_OFFSET':
      return handleUpdateOffset(state, action)

    case 'robot:UPDATE_OFFSET_SUCCESS':
      return handleUpdateOffsetSuccess(state, action)

    case 'robot:UPDATE_OFFSET_FAILURE':
      return handleUpdateOffsetFailure(state, action)

    case 'robot:SET_MODULES_REVIEWED':
      return handleSetModulesReviewed(state, action)

    case 'robot:RETURN_TIP':
      return handleReturnTip(state, action)

    case 'robot:RETURN_TIP_RESPONSE':
      return handleReturnTipResponse(state, action)

    // TODO(mc, 20187-01-26): caution - not covered by flow yet
    case SET_DECK_POPULATED:
      return handleSetDeckPopulated(state, action)
    case MOVE_TO_FRONT:
      return handleMoveToFront(state, action)
    case MOVE_TO_FRONT_RESPONSE:
      return handleMoveToFrontResponse(state, action)
    case PROBE_TIP:
      return handleProbeTip(state, action)
    case PROBE_TIP_RESPONSE:
      return handleProbeTipResponse(state, action)
    case CONFIRM_LABWARE:
      return handleConfirmLabware(state, action)
  }

  return state
}

function handleSetDeckPopulated(
  state: CalibrationState,
  action: any
): CalibrationState {
  return { ...state, deckPopulated: action.payload }
}

function handleSetModulesReviewed(
  state: CalibrationState,
  action: SetModulesReviewedAction
): CalibrationState {
  return { ...state, modulesReviewed: action.payload }
}

function handleMoveToFront(
  state: CalibrationState,
  action: any
): CalibrationState {
  if (!action.payload || !action.payload.mount) return state

  const {
    payload: { mount },
  } = action

  return {
    ...state,
    deckPopulated: false,
    modulesReviewed: false,
    calibrationRequest: {
      type: 'MOVE_TO_FRONT',
      inProgress: true,
      error: null,
      mount,
    },
  }
}

function handleMoveToFrontResponse(
  state: CalibrationState,
  action: any
): CalibrationState {
  const { payload, error } = action

  return {
    ...state,
    calibrationRequest: {
      ...state.calibrationRequest,
      inProgress: false,
      error: error ? payload : null,
    },
  }
}

function handleProbeTip(
  state: CalibrationState,
  action: any
): CalibrationState {
  if (!action.payload || !action.payload.mount) return state

  const {
    payload: { mount },
  } = action

  return {
    ...state,
    calibrationRequest: {
      type: 'PROBE_TIP',
      mount: mount,
      inProgress: true,
      error: null,
    },
    probedByMount: {
      ...state.probedByMount,
      [mount]: false,
    },
  }
}

function handleProbeTipResponse(
  state: CalibrationState,
  action: any
): CalibrationState {
  const { payload, error } = action

  return {
    ...state,
    calibrationRequest: {
      ...state.calibrationRequest,
      inProgress: false,
      error: error ? payload : null,
    },
    confirmedBySlot: {},
  }
}

function handleConfirmProbed(
  state: CalibrationState,
  action: ConfirmProbedAction
): CalibrationState {
  const nextProbedByMount = { ...state.probedByMount }
  nextProbedByMount[action.payload] = true
  return { ...state, probedByMount: nextProbedByMount }
}

function handleMoveTo(
  state: CalibrationState,
  action: LabwareCalibrationAction
): CalibrationState {
  const { mount, slot } = action.payload

  return {
    ...state,
    deckPopulated: true,
    modulesReviewed: true,
    calibrationRequest: {
      type: 'MOVE_TO',
      inProgress: true,
      error: null,
      mount,
      slot,
    },
  }
}

function handleMoveToSuccess(
  state: CalibrationState,
  action: CalibrationSuccessAction
): CalibrationState {
  const {
    calibrationRequest: { slot },
  } = state
  if (!slot) return state

  return {
    ...state,
    calibrationRequest: {
      ...state.calibrationRequest,
      inProgress: false,
      error: null,
    },
  }
}

function handleMoveToFailure(
  state: CalibrationState,
  action: CalibrationFailureAction
): CalibrationState {
  const {
    calibrationRequest: { slot },
  } = state
  if (!slot) return state

  const error = action.payload

  return {
    ...state,
    calibrationRequest: {
      ...state.calibrationRequest,
      inProgress: false,
      error: error,
    },
  }
}

function handlePickupAndHome(
  state: CalibrationState,
  action: LabwareCalibrationAction
): CalibrationState {
  const {
    payload: { mount, slot },
  } = action

  return {
    ...state,
    deckPopulated: true,
    modulesReviewed: true,
    calibrationRequest: {
      type: 'PICKUP_AND_HOME',
      inProgress: true,
      error: null,
      mount,
      slot,
    },
  }
}

function handlePickupAndHomeSuccess(
  state: CalibrationState,
  action: CalibrationSuccessAction
): CalibrationState {
  const { calibrationRequest, tipOnByMount } = state
  const { mount, slot } = calibrationRequest
  if (!slot || !mount) return state

  // assume that only one tip can be on at a time
  const nextTipOnByMount = mapValues(tipOnByMount, () => false)
  nextTipOnByMount[mount] = true

  return {
    ...state,
    calibrationRequest: {
      ...calibrationRequest,
      inProgress: false,
      error: null,
    },

    tipOnByMount: nextTipOnByMount,
  }
}

function handlePickupAndHomeFailure(
  state: CalibrationState,
  action: CalibrationFailureAction
): CalibrationState {
  const {
    calibrationRequest: { mount, slot },
  } = state
  if (!slot || !mount) return state

  const error = action.payload

  return {
    ...state,
    calibrationRequest: {
      ...state.calibrationRequest,
      inProgress: false,
      error,
    },
  }
}

function handleDropTipAndHome(
  state: CalibrationState,
  action: LabwareCalibrationAction
): CalibrationState {
  const {
    payload: { mount, slot },
  } = action

  return {
    ...state,
    calibrationRequest: {
      type: 'DROP_TIP_AND_HOME',
      inProgress: true,
      error: null,
      mount,
      slot,
    },
  }
}

function handleDropTipAndHomeSuccess(
  state: CalibrationState,
  action: CalibrationSuccessAction
): CalibrationState {
  const { calibrationRequest, tipOnByMount } = state
  const { mount, slot } = calibrationRequest
  if (!slot || !mount) return state

  // assume that only one tip can be on at a time
  const nextTipOnByMount = { ...tipOnByMount }
  nextTipOnByMount[mount] = false

  return {
    ...state,
    calibrationRequest: {
      ...calibrationRequest,
      inProgress: false,
      error: null,
    },

    tipOnByMount: nextTipOnByMount,
  }
}

function handleDropTipAndHomeFailure(
  state: CalibrationState,
  action: CalibrationFailureAction
): CalibrationState {
  const {
    calibrationRequest: { mount, slot },
  } = state
  if (!slot || !mount) return state

  const error = action.payload

  return {
    ...state,
    calibrationRequest: {
      ...state.calibrationRequest,
      inProgress: false,
      error,
    },
  }
}

function handleConfirmTiprack(
  state: CalibrationState,
  action: LabwareCalibrationAction
): CalibrationState {
  const {
    payload: { mount, slot },
  } = action

  return {
    ...state,
    calibrationRequest: {
      type: 'CONFIRM_TIPRACK',
      inProgress: true,
      error: null,
      mount,
      slot,
    },
  }
}

function handleConfirmTiprackSuccess(
  state: CalibrationState,
  action: CalibrationSuccessAction
): CalibrationState {
  const { calibrationRequest, tipOnByMount, confirmedBySlot } = state
  const { mount, slot } = calibrationRequest
  if (!slot || !mount) return state

  const tipOn = action.payload.tipOn || false
  const nextTipOnByMount = { ...tipOnByMount }
  const nextConfirmedBySlot = { ...confirmedBySlot }

  nextTipOnByMount[mount] = tipOn
  nextConfirmedBySlot[slot] = true

  return {
    ...state,
    calibrationRequest: {
      ...calibrationRequest,
      inProgress: false,
      error: null,
    },
    tipOnByMount: nextTipOnByMount,
    confirmedBySlot: nextConfirmedBySlot,
  }
}

function handleConfirmTiprackFailure(
  state: CalibrationState,
  action: CalibrationFailureAction
): CalibrationState {
  const {
    calibrationRequest: { mount, slot },
  } = state
  if (!slot || !mount) return state

  const error = action.payload

  return {
    ...state,
    calibrationRequest: {
      ...state.calibrationRequest,
      inProgress: false,
      error,
    },
  }
}

function handleJog(
  state: CalibrationState,
  action: PipetteCalibrationAction
): CalibrationState {
  const {
    payload: { mount },
  } = action

  return {
    ...state,
    calibrationRequest: {
      // make sure we hang on to any state from a previous labware calibration
      ...state.calibrationRequest,
      type: 'JOG',
      inProgress: true,
      error: null,
      mount,
    },
  }
}

function handleJogSuccess(
  state: CalibrationState,
  action: CalibrationSuccessAction
): CalibrationState {
  return {
    ...state,
    calibrationRequest: {
      ...state.calibrationRequest,
      inProgress: false,
      error: null,
    },
  }
}

function handleJogFailure(
  state: CalibrationState,
  action: CalibrationFailureAction
): CalibrationState {
  const error = action.payload

  return {
    ...state,
    calibrationRequest: {
      ...state.calibrationRequest,
      inProgress: false,
      error,
    },
  }
}

function handleUpdateOffset(
  state: CalibrationState,
  action: LabwareCalibrationAction
): CalibrationState {
  const {
    payload: { mount, slot },
  } = action

  return {
    ...state,
    calibrationRequest: {
      type: 'UPDATE_OFFSET',
      inProgress: true,
      error: null,
      mount,
      slot,
    },
  }
}

function handleUpdateOffsetSuccess(
  state: CalibrationState,
  action: CalibrationSuccessAction
): CalibrationState {
  const { calibrationRequest, confirmedBySlot } = state
  const { mount, slot } = calibrationRequest
  if (!slot || !mount) return state

  const nextConfirmBySlot = { ...confirmedBySlot }
  nextConfirmBySlot[slot] = true

  return {
    ...state,
    calibrationRequest: {
      ...calibrationRequest,
      inProgress: false,
      error: null,
    },
    confirmedBySlot: nextConfirmBySlot,
  }
}

function handleUpdateOffsetFailure(
  state: CalibrationState,
  action: CalibrationFailureAction
): CalibrationState {
  const {
    calibrationRequest: { mount, slot },
  } = state
  if (!mount || !slot) return state

  const error = action.payload

  return {
    ...state,
    calibrationRequest: {
      ...state.calibrationRequest,
      inProgress: false,
      error,
    },
  }
}

function handleConfirmLabware(
  state: CalibrationState,
  action: any
): CalibrationState {
  if (!action.payload || !action.payload.labware) return state

  const {
    payload: { labware: slot },
  } = action

  return {
    ...state,
    confirmedBySlot: { ...state.confirmedBySlot, [slot]: true },
  }
}

function handleReturnTip(
  state: CalibrationState,
  action: ReturnTipAction
): CalibrationState {
  const {
    payload: { mount },
  } = action
  return {
    ...state,
    calibrationRequest: {
      type: 'RETURN_TIP',
      inProgress: true,
      error: null,
      mount,
    },
  }
}

function handleReturnTipResponse(
  state: CalibrationState,
  action: ReturnTipResponseAction
): CalibrationState {
  const { calibrationRequest, tipOnByMount } = state
  const { mount } = calibrationRequest
  if (!mount) return state

  const nextTipOnByMount = { ...tipOnByMount }
  nextTipOnByMount[mount] = false

  return {
    ...state,
    calibrationRequest: {
      ...calibrationRequest,
      inProgress: false,
      error: null,
    },
    tipOnByMount: nextTipOnByMount,
  }
}
