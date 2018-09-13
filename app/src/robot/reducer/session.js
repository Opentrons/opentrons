// @flow
// robot session (protocol) state and reducer
import omit from 'lodash/omit'
import {actionTypes} from '../actions'

import type {Action} from '../../types'
import type {
  Command,
  StatePipette,
  StateLabware,
  SessionModule,
  Mount,
  Slot,
  SessionStatus,
} from '../types'

import type {DisconnectResponseAction, SessionUpdateAction} from '../actions'

type Request = {
  inProgress: boolean,
  error: ?{message: string},
}

export type State = {
  sessionRequest: Request,
  state: SessionStatus,
  errors: Array<{}>,
  // TODO(mc, 2018-01-11): command IDs should be strings
  protocolCommands: Array<number>,
  protocolCommandsById: {
    [number]: Command,
  },
  pipettesByMount: {
    [Mount]: StatePipette,
  },
  labwareBySlot: {
    [Slot]: StateLabware,
  },
  modulesBySlot: {
    [Slot]: SessionModule,
  },
  runRequest: Request,
  pauseRequest: Request,
  resumeRequest: Request,
  cancelRequest: Request,
  startTime: ?number,
  runTime: number,
}

// TODO(mc, 2018-01-11): replace actionType constants with Flow types
const {
  RUN,
  RUN_RESPONSE,
  PAUSE,
  PAUSE_RESPONSE,
  RESUME,
  RESUME_RESPONSE,
  CANCEL,
  CANCEL_RESPONSE,
  TICK_RUN_TIME,
} = actionTypes

const INITIAL_STATE: State = {
  // loading a protocol
  sessionRequest: {inProgress: false, error: null},
  state: '',
  errors: [],
  protocolCommands: [],
  protocolCommandsById: {},

  // deck setup from protocol
  pipettesByMount: {},
  labwareBySlot: {},
  modulesBySlot: {},

  // running a protocol
  runRequest: {inProgress: false, error: null},
  pauseRequest: {inProgress: false, error: null},
  resumeRequest: {inProgress: false, error: null},
  cancelRequest: {inProgress: false, error: null},
  startTime: null,
  runTime: 0,
}

export default function sessionReducer (
  state: State = INITIAL_STATE,
  action: Action
): State {
  switch (action.type) {
    case 'robot:DISCONNECT_RESPONSE':
      return handleDisconnectResponse(state, action)

    case 'robot:SESSION_UPDATE':
      return handleSessionUpdate(state, action)

    case 'protocol:UPLOAD':
    case 'robot:REFRESH_SESSION':
      return handleSessionInProgress(state)

    case 'robot:SESSION_RESPONSE':
    case 'robot:SESSION_ERROR':
      return handleSessionResponse(state, action)

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

function handleDisconnectResponse (
  state: State,
  action: DisconnectResponseAction
): State {
  return INITIAL_STATE
}

function handleSessionUpdate (
  state: State,
  action: SessionUpdateAction
): State {
  const {payload: {state: sessionState, startTime, lastCommand}} = action
  let {protocolCommandsById} = state

  if (lastCommand) {
    const command = {
      ...protocolCommandsById[lastCommand.id],
      ...lastCommand,
    }

    protocolCommandsById = {
      ...protocolCommandsById,
      [lastCommand.id]: command,
    }
  }

  return {...state, state: sessionState, startTime, protocolCommandsById}
}

function handleSessionInProgress (state: State): State {
  return {
    ...state,
    runTime: 0,
    startTime: null,
    sessionRequest: {inProgress: true, error: null},
  }
}

function handleSessionResponse (state: State, action: any): State {
  const {payload} = action

  if (payload.error) {
    return {
      ...state,
      sessionRequest: {inProgress: false, error: payload.error},
    }
  }

  const session = omit(payload, ['name', 'protocolText'])

  return {
    ...state,
    sessionRequest: {inProgress: false, error: null},
    ...session,
  }
}

function handleRun (state: State, action: any): State {
  return {...state, runTime: 0, runRequest: {inProgress: true, error: null}}
}

function handleRunResponse (state: State, action: any): State {
  const {error, payload} = action

  if (error) return {...state, runRequest: {inProgress: false, error: payload}}

  return {...state, runRequest: {inProgress: false, error: null}}
}

function handleTickRunTime (state: State, action: any): State {
  return {...state, runTime: Date.now()}
}

function handlePause (state: State, action: any): State {
  return {...state, pauseRequest: {inProgress: true, error: null}}
}

function handlePauseResponse (state: State, action: any): State {
  const {error, payload} = action

  if (error) {
    return {...state, pauseRequest: {inProgress: false, error: payload}}
  }

  return {...state, pauseRequest: {inProgress: false, error: null}}
}

function handleResume (state: State, action: any): State {
  return {...state, resumeRequest: {inProgress: true, error: null}}
}

function handleResumeResponse (state: State, action: any): State {
  const {error, payload} = action

  if (error) {
    return {...state, resumeRequest: {inProgress: false, error: payload}}
  }

  return {...state, resumeRequest: {inProgress: false, error: null}}
}

function handleCancel (state: State, action: any): State {
  return {...state, cancelRequest: {inProgress: true, error: null}}
}

function handleCancelResponse (state: State, action: any): State {
  const {error, payload} = action
  if (error) {
    return {...state, cancelRequest: {inProgress: false, error: payload}}
  }

  return {...state, cancelRequest: {inProgress: false, error: null}}
}
