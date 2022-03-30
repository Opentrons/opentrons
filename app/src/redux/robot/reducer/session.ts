// robot session (protocol) state and reducer
// TODO(mc, 2022-03-04): delete this file

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
  return state
}
