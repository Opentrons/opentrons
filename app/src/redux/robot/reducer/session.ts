// robot session (protocol) state and reducer
// TODO(mc, 2022-03-04): delete this file. Keeping around for now
// to aid in preserving any important logic that needs to be moved
// to HTTP-based hooks

// import omit from 'lodash/omit'
// import { actionTypes } from '../actions'

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

// import type { InvalidProtocolFileAction } from '../../protocol/types'
// import type { SessionUpdateAction } from '../actions'

export interface Request {
  inProgress: boolean
  error: { message: string } | null | undefined
}

export interface SessionState {
  sessionRequest: Request
  state: SessionStatus
  statusInfo: SessionStatusInfo
  // TODO(aa, 2020-06-01): DoorState is not currently used anywhere yet
  doorState: DoorState
  blocked: boolean
  errors: Array<{ timestamp: number; line: number; message: string }>
  // TODO(mc, 2018-01-11): command IDs should be strings
  protocolCommands: number[]
  protocolCommandsById: { [id: number]: Command }
  pipettesByMount: { [mount in Mount]?: StatePipette }
  labwareBySlot: { [slot in Slot]?: StateLabware }
  modulesBySlot: { [slot in Slot]?: SessionModule }
  runRequest: Request
  pauseRequest: Request
  resumeRequest: Request
  cancelRequest: Request
  startTime: number | null | undefined
  apiLevel: [number, number] | null
  capabilities: string[]
}

// const {
//   RUN,
//   RUN_RESPONSE,
//   PAUSE,
//   PAUSE_RESPONSE,
//   RESUME,
//   RESUME_RESPONSE,
//   CANCEL,
//   CANCEL_RESPONSE,
// } = actionTypes

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
  startTime: null,
  apiLevel: null,
}

export function sessionReducer(
  state: SessionState = INITIAL_STATE,
  action: Action
): SessionState {
  // switch (action.type) {
  //   case 'robot:CONNECT_RESPONSE': {
  //     if (action.payload.error) return state
  //     return {
  //       ...state,
  //       capabilities: action.payload.sessionCapabilities,
  //     }
  //   }

  //   case 'robot:DISCONNECT_RESPONSE':
  //     return INITIAL_STATE

  //   case 'robot:SESSION_UPDATE':
  //     return handleSessionUpdate(state, action)

  //   case 'protocol:UPLOAD':
  //     return handleSessionInProgress({
  //       ...INITIAL_STATE,
  //       capabilities: state.capabilities,
  //     })

  //   case 'robot:REFRESH_SESSION':
  //     return handleSessionInProgress(state)

  //   case 'robot:SESSION_RESPONSE':
  //   case 'robot:SESSION_ERROR':
  //     return handleSessionResponse(state, action)
  //   case 'protocol:INVALID_FILE':
  //     return handleInvalidFile(
  //       {
  //         ...INITIAL_STATE,
  //         capabilities: state.capabilities,
  //       },
  //       action
  //     )

  //   case RUN:
  //     return handleRun(state, action)
  //   case RUN_RESPONSE:
  //     return handleRunResponse(state, action)
  //   case PAUSE:
  //     return handlePause(state, action)
  //   case PAUSE_RESPONSE:
  //     return handlePauseResponse(state, action)
  //   case RESUME:
  //     return handleResume(state, action)
  //   case RESUME_RESPONSE:
  //     return handleResumeResponse(state, action)
  //   case CANCEL:
  //     return handleCancel(state, action)
  //   case CANCEL_RESPONSE:
  //     return handleCancelResponse(state, action)
  // }

  return state
}

// function handleSessionUpdate(
//   state: SessionState,
//   action: SessionUpdateAction
// ): SessionState {
//   const {
//     payload: { state: sessionStateUpdate, startTime, lastCommand },
//   } = action
//   let { protocolCommandsById } = state

//   if (lastCommand) {
//     const command = {
//       ...protocolCommandsById[lastCommand.id],
//       ...lastCommand,
//     }

//     protocolCommandsById = {
//       ...protocolCommandsById,
//       [lastCommand.id]: command,
//     }
//   }

//   // TODO(mc, 2019-07-15): remove this workaround when API issue is resolved
//   // https://github.com/Opentrons/opentrons/issues/2994
//   const sessionState =
//     state.state === 'stopped' && sessionStateUpdate === 'error'
//       ? 'stopped'
//       : sessionStateUpdate

//   return {
//     ...state,
//     state: sessionState,
//     statusInfo: action.payload.statusInfo,
//     doorState: action.payload.doorState,
//     blocked: action.payload.blocked,
//     startTime,
//     protocolCommandsById,
//   }
// }

// function handleSessionInProgress(state: SessionState): SessionState {
//   return {
//     ...state,
//     startTime: null,
//     sessionRequest: { inProgress: true, error: null },
//   }
// }

// function handleSessionResponse(state: SessionState, action: any): SessionState {
//   const { payload } = action

//   if (payload.error) {
//     return {
//       ...state,
//       sessionRequest: { inProgress: false, error: payload.error },
//     }
//   }

//   const session = omit(payload, ['name', 'protocolText'])

//   return {
//     ...state,
//     sessionRequest: { inProgress: false, error: null },
//     ...session,
//   }
// }

// function handleInvalidFile(
//   state: SessionState,
//   action: InvalidProtocolFileAction
// ): SessionState {
//   return {
//     ...state,
//     sessionRequest: {
//       inProgress: false,
//       error: { message: action.payload.message },
//     },
//   }
// }

// function handleRun(state: SessionState, action: any): SessionState {
//   return { ...state, runRequest: { inProgress: true, error: null } }
// }

// function handleRunResponse(state: SessionState, action: any): SessionState {
//   const { error, payload } = action

//   if (error) {
//     return { ...state, runRequest: { inProgress: false, error: payload } }
//   }

//   return { ...state, runRequest: { inProgress: false, error: null } }
// }

// function handlePause(state: SessionState, action: any): SessionState {
//   return { ...state, pauseRequest: { inProgress: true, error: null } }
// }

// function handlePauseResponse(state: SessionState, action: any): SessionState {
//   const { error, payload } = action

//   if (error) {
//     return { ...state, pauseRequest: { inProgress: false, error: payload } }
//   }

//   return { ...state, pauseRequest: { inProgress: false, error: null } }
// }

// function handleResume(state: SessionState, action: any): SessionState {
//   return { ...state, resumeRequest: { inProgress: true, error: null } }
// }

// function handleResumeResponse(state: SessionState, action: any): SessionState {
//   const { error, payload } = action

//   if (error) {
//     return { ...state, resumeRequest: { inProgress: false, error: payload } }
//   }

//   return { ...state, resumeRequest: { inProgress: false, error: null } }
// }

// function handleCancel(state: SessionState, action: any): SessionState {
//   return { ...state, cancelRequest: { inProgress: true, error: null } }
// }

// function handleCancelResponse(state: SessionState, action: any): SessionState {
//   const { error, payload } = action
//   if (error) {
//     return { ...state, cancelRequest: { inProgress: false, error: payload } }
//   }

//   return { ...state, cancelRequest: { inProgress: false, error: null } }
// }
