// @flow
// robot session (protocol) state and reducer
import type {Command, StateInstrument, StateLabware, Mount, Slot} from '../types'
import type {SessionStatus} from '../constants'
import {actionTypes} from '../actions'

type Request = {
  inProgress: boolean,
  error: ?{message: string}
}

export type State = {
  sessionRequest: Request,
  name: string,
  state: SessionStatus,
  errors: {}[],
  protocolText: string,
  // TODO(mc, 2018-01-11): command IDs should be strings
  protocolCommands: number[],
  protocolCommandsById: {
    [number]: Command
  },
  instrumentsByMount: {
    [Mount]: StateInstrument
  },
  labwareBySlot: {
    [Slot]: StateLabware
  },
  runRequest: Request,
  pauseRequest: Request,
  resumeRequest: Request,
  cancelRequest: Request,
  runTime: number,
}

// TODO(mc, 2018-01-11): import union of discrete action types from actions
type Action = {
  type: string,
  payload?: any,
  error?: boolean,
  meta?: {}
}

// TODO(mc, 2018-01-11): replace actionType constants with Flow types
const {
  DISCONNECT_RESPONSE,
  SESSION,
  SESSION_RESPONSE,
  RUN,
  RUN_RESPONSE,
  PAUSE,
  PAUSE_RESPONSE,
  RESUME,
  RESUME_RESPONSE,
  CANCEL,
  CANCEL_RESPONSE,
  TICK_RUN_TIME
} = actionTypes

const INITIAL_STATE: State = {
  // loading a protocol
  sessionRequest: {inProgress: false, error: null},
  name: '',
  state: '',
  errors: [],
  protocolText: '',
  protocolCommands: [],
  protocolCommandsById: {},

  // deck setup from protocol
  instrumentsByMount: {},
  labwareBySlot: {},

  // running a protocol
  runRequest: {inProgress: false, error: null},
  pauseRequest: {inProgress: false, error: null},
  resumeRequest: {inProgress: false, error: null},
  cancelRequest: {inProgress: false, error: null},
  runTime: 0
}

export default function sessionReducer (
  state: State = INITIAL_STATE,
  action: Action
): State {
  switch (action.type) {
    case DISCONNECT_RESPONSE: return handleDisconnectResponse(state, action)
    case SESSION: return handleSession(state, action)
    case SESSION_RESPONSE: return handleSessionResponse(state, action)
    case RUN: return handleRun(state, action)
    case RUN_RESPONSE: return handleRunResponse(state, action)
    case PAUSE: return handlePause(state, action)
    case PAUSE_RESPONSE: return handlePauseResponse(state, action)
    case RESUME: return handleResume(state, action)
    case RESUME_RESPONSE: return handleResumeResponse(state, action)
    case CANCEL: return handleCancel(state, action)
    case CANCEL_RESPONSE: return handleCancelResponse(state, action)
    case TICK_RUN_TIME: return handleTickRunTime(state, action)
  }

  return state
}

function handleDisconnectResponse (state, action) {
  if (action.error) return state
  return INITIAL_STATE
}

function handleSession (state, action) {
  if (!action.payload || !action.payload.file) return state

  const {payload: {file: {name}}} = action
  const sessionRequest = {inProgress: true, error: null}

  return {...state, name, sessionRequest}
}

function handleSessionResponse (state, action) {
  const {error, payload} = action

  if (error) {
    return {...state, sessionRequest: {inProgress: false, error: payload}}
  }

  return {
    ...state,
    sessionRequest: {inProgress: false, error: null},
    ...payload
  }
}

function handleRun (state, action) {
  return {...state, runTime: 0, runRequest: {inProgress: true, error: null}}
}

function handleRunResponse (state, action) {
  const {error, payload} = action

  if (error) return {...state, runRequest: {inProgress: false, error: payload}}

  return {...state, runRequest: {inProgress: false, error: null}}
}

function handleTickRunTime (state, action) {
  return {...state, runTime: Date.now()}
}

function handlePause (state, action) {
  return {...state, pauseRequest: {inProgress: true, error: null}}
}

function handlePauseResponse (state, action) {
  const {error, payload} = action

  if (error) {
    return {...state, pauseRequest: {inProgress: false, error: payload}}
  }

  return {...state, pauseRequest: {inProgress: false, error: null}}
}

function handleResume (state, action) {
  return {...state, resumeRequest: {inProgress: true, error: null}}
}

function handleResumeResponse (state, action) {
  const {error, payload} = action

  if (error) {
    return {...state, resumeRequest: {inProgress: false, error: payload}}
  }

  return {...state, resumeRequest: {inProgress: false, error: null}}
}

function handleCancel (state, action) {
  return {...state, cancelRequest: {inProgress: true, error: null}}
}

function handleCancelResponse (state, action) {
  const {error, payload} = action

  if (error) {
    return {...state, cancelRequest: {inProgress: false, error: payload}}
  }

  return {...state, cancelRequest: {inProgress: false, error: null}}
}
