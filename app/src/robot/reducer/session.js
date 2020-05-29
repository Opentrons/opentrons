// @flow
// robot session (protocol) state and reducer
import omit from 'lodash/omit'
import { actionTypes } from '../actions'

import type { Action } from '../../types'
import type {
  Command,
  StatePipette,
  StateLabware,
  SessionModule,
  Mount,
  Slot,
  DoorState,
  SessionStatus,
  SessionStatusInfo,
} from '../types'

import type { InvalidProtocolFileAction } from '../../protocol/types'
import type { SessionUpdateAction } from '../actions'

type Request = {
  inProgress: boolean,
  error: ?{ message: string },
}

export type SessionState = {
  sessionRequest: Request,
  state: SessionStatus,
  statusInfo: SessionStatusInfo,
  doorState: DoorState,
  blocked: boolean,
  errors: Array<{|
    timestamp: number,
    line: number,
    message: string,
  |}>,
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
  remoteTimeCompensation: number | null,
  startTime: ?number,
  runTime: number,
  apiLevel: [number, number] | null,
  capabilities: Array<string>,
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

const INITIAL_STATE: SessionState = {
  // loading a protocol
  sessionRequest: { inProgress: false, error: null },
  state: '',
  statusInfo: {
    message: null,
    changedAt: null,
    estimatedDuration: null,
    userMessage: null,
  },
  doorState: null,
  blocked: false,
  errors: [],
  protocolCommands: [],
  protocolCommandsById: {},
  capabilities: [],

  // deck setup from protocol
  pipettesByMount: {},
  labwareBySlot: {},
  modulesBySlot: {},

  // running a protocol
  runRequest: { inProgress: false, error: null },
  pauseRequest: { inProgress: false, error: null },
  resumeRequest: { inProgress: false, error: null },
  cancelRequest: { inProgress: false, error: null },
  remoteTimeCompensation: null,
  startTime: null,
  runTime: 0,
  apiLevel: null,
}

export function sessionReducer(
  state: SessionState = INITIAL_STATE,
  action: Action
): SessionState {
  switch (action.type) {
    case 'robot:CONNECT_RESPONSE': {
      if (action.payload.error) return state
      return {
        ...state,
        capabilities: action.payload.sessionCapabilities,
      }
    }

    case 'robot:DISCONNECT_RESPONSE':
      return INITIAL_STATE

    case 'robot:SESSION_UPDATE':
      return handleSessionUpdate(state, action)

    case 'protocol:UPLOAD':
      return handleSessionInProgress({
        ...INITIAL_STATE,
        capabilities: state.capabilities,
      })

    case 'robot:REFRESH_SESSION':
      return handleSessionInProgress(state)

    case 'robot:SESSION_RESPONSE':
    case 'robot:SESSION_ERROR':
      return handleSessionResponse(state, action)
    case 'protocol:INVALID_FILE':
      return handleInvalidFile(
        {
          ...INITIAL_STATE,
          capabilities: state.capabilities,
        },
        action
      )

    case RUN:
      return handleRun(state, action)
    case RUN_RESPONSE:
      return handleRunResponse(state, action)
    case PAUSE:
      return handlePause(state, action)
    case PAUSE_RESPONSE:
      return handlePauseResponse(state, action)
    case RESUME:
      return handleResume(state, action)
    case RESUME_RESPONSE:
      return handleResumeResponse(state, action)
    case CANCEL:
      return handleCancel(state, action)
    case CANCEL_RESPONSE:
      return handleCancelResponse(state, action)
    case TICK_RUN_TIME:
      return handleTickRunTime(state, action)
  }

  return state
}

function handleSessionUpdate(
  state: SessionState,
  action: SessionUpdateAction
): SessionState {
  const {
    payload: { state: sessionStateUpdate, startTime, lastCommand },
    meta: { now },
  } = action
  let { protocolCommandsById, remoteTimeCompensation } = state

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

  // compensate for clock differences between the robot and app
  if (remoteTimeCompensation === null) {
    const latestRemoteTime = lastCommand?.handledAt || startTime
    if (latestRemoteTime) {
      remoteTimeCompensation = now - latestRemoteTime
    }
  }

  // TODO(mc, 2019-07-15): remove this workaround when API issue is resolved
  // https://github.com/Opentrons/opentrons/issues/2994
  const sessionState =
    state.state === 'stopped' && sessionStateUpdate === 'error'
      ? 'stopped'
      : sessionStateUpdate

  return {
    ...state,
    state: sessionState,
    statusInfo: action.payload.statusInfo,
    doorState: action.payload.doorState,
    blocked: action.payload.blocked,
    remoteTimeCompensation,
    startTime,
    protocolCommandsById,
  }
}

function handleSessionInProgress(state: SessionState): SessionState {
  return {
    ...state,
    runTime: 0,
    startTime: null,
    remoteTimeCompensation: null,
    sessionRequest: { inProgress: true, error: null },
  }
}

function handleSessionResponse(state: SessionState, action: any): SessionState {
  const { payload } = action

  if (payload.error) {
    return {
      ...state,
      sessionRequest: { inProgress: false, error: payload.error },
    }
  }

  const session = omit(payload, ['name', 'protocolText'])

  return {
    ...state,
    sessionRequest: { inProgress: false, error: null },
    ...session,
  }
}

function handleInvalidFile(
  state: SessionState,
  action: InvalidProtocolFileAction
): SessionState {
  return {
    ...state,
    sessionRequest: {
      inProgress: false,
      error: { message: action.payload.message },
    },
  }
}

function handleRun(state: SessionState, action: any): SessionState {
  return { ...state, runTime: 0, runRequest: { inProgress: true, error: null } }
}

function handleRunResponse(state: SessionState, action: any): SessionState {
  const { error, payload } = action

  if (error) {
    return { ...state, runRequest: { inProgress: false, error: payload } }
  }

  return { ...state, runRequest: { inProgress: false, error: null } }
}

function handleTickRunTime(state: SessionState, action: any): SessionState {
  return { ...state, runTime: Date.now() }
}

function handlePause(state: SessionState, action: any): SessionState {
  return { ...state, pauseRequest: { inProgress: true, error: null } }
}

function handlePauseResponse(state: SessionState, action: any): SessionState {
  const { error, payload } = action

  if (error) {
    return { ...state, pauseRequest: { inProgress: false, error: payload } }
  }

  return { ...state, pauseRequest: { inProgress: false, error: null } }
}

function handleResume(state: SessionState, action: any): SessionState {
  return { ...state, resumeRequest: { inProgress: true, error: null } }
}

function handleResumeResponse(state: SessionState, action: any): SessionState {
  const { error, payload } = action

  if (error) {
    return { ...state, resumeRequest: { inProgress: false, error: payload } }
  }

  return { ...state, resumeRequest: { inProgress: false, error: null } }
}

function handleCancel(state: SessionState, action: any): SessionState {
  return { ...state, cancelRequest: { inProgress: true, error: null } }
}

function handleCancelResponse(state: SessionState, action: any): SessionState {
  const { error, payload } = action
  if (error) {
    return { ...state, cancelRequest: { inProgress: false, error: payload } }
  }

  return { ...state, cancelRequest: { inProgress: false, error: null } }
}
