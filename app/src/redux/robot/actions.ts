// robot actions and action types
import type { Error } from '../types'
import type { ProtocolData } from '../protocol/types'
import type { Mount, Slot, Axis, Direction, SessionUpdate } from './types'

export interface ConnectAction {
  type: 'robot:CONNECT'
  payload: {
    name: string
  }
  meta: {
    robotCommand: true
  }
}

export interface ConnectResponseAction {
  type: 'robot:CONNECT_RESPONSE'
  payload: {
    error: Error | null | undefined
    sessionCapabilities: string[]
  }
}

export interface ReturnTipAction {
  type: 'robot:RETURN_TIP'
  payload: {
    mount: Mount
  }
  meta: {
    robotCommand: true
  }
}

export interface ReturnTipResponseAction {
  type: 'robot:RETURN_TIP_RESPONSE'
  error: boolean
  payload?: Error
}

export interface ClearConnectResponseAction {
  type: 'robot:CLEAR_CONNECT_RESPONSE'
}

export interface DisconnectAction {
  type: 'robot:DISCONNECT'
  meta: {
    robotCommand: true
  }
}

export interface DisconnectResponseAction {
  type: 'robot:DISCONNECT_RESPONSE'
  payload: {}
}

export interface UnexpectedDisconnectAction {
  type: 'robot:UNEXPECTED_DISCONNECT'
}

export interface ConfirmProbedAction {
  type: 'robot:CONFIRM_PROBED'
  payload: Mount
  meta: {
    robotCommand: true
  }
}

export interface PipetteCalibrationAction {
  type: 'robot:JOG'
  payload: {
    mount: Mount
    axis?: Axis
    direction?: Direction
    step?: number
  }
  meta: {
    robotCommand: true
  }
}

export interface SetJogDistanceAction {
  type: 'robot:SET_JOG_DISTANCE'
  payload: number
}

export interface LabwareCalibrationAction {
  type:
    | 'robot:MOVE_TO'
    | 'robot:PICKUP_AND_HOME'
    | 'robot:DROP_TIP_AND_HOME'
    | 'robot:CONFIRM_TIPRACK'
    | 'robot:UPDATE_OFFSET'
    | 'robot:SET_JOG_DISTANCE'
  payload: {
    mount: Mount
    slot: Slot
  }
  meta: {
    robotCommand: true
  }
}

export interface CalibrationSuccessAction {
  type:
    | 'robot:MOVE_TO_SUCCESS'
    | 'robot:JOG_SUCCESS'
    | 'robot:PICKUP_AND_HOME_SUCCESS'
    | 'robot:DROP_TIP_AND_HOME_SUCCESS'
    | 'robot:CONFIRM_TIPRACK_SUCCESS'
    | 'robot:UPDATE_OFFSET_SUCCESS'
    | 'robot:RETURN_TIP_SUCCESS'
  payload: {
    isTiprack?: boolean
    tipOn?: boolean
  }
}

export interface CalibrationFailureAction {
  type:
    | 'robot:MOVE_TO_FAILURE'
    | 'robot:JOG_FAILURE'
    | 'robot:PICKUP_AND_HOME_FAILURE'
    | 'robot:DROP_TIP_AND_HOME_FAILURE'
    | 'robot:CONFIRM_TIPRACK_FAILURE'
    | 'robot:UPDATE_OFFSET_FAILURE'
    | 'robot:RETURN_TIP_FAILURE'
  error: true
  payload: Error
}

export interface SessionResponseAction {
  type: 'robot:SESSION_RESPONSE'
  // TODO(mc, 2018-09-06): this payload is incomplete
  payload: {
    name: string
    protocolText: string
    metadata?: ProtocolData['metadata'] | null | undefined
    apiLevel: [number, number]
    [key: string]: unknown
  }
  meta: { freshUpload: boolean }
}

export interface SessionErrorAction {
  type: 'robot:SESSION_ERROR'
  payload: { error: Error }
  meta: { freshUpload: boolean }
}

export interface SessionUpdateAction {
  type: 'robot:SESSION_UPDATE'
  payload: SessionUpdate
  meta: { now: number }
}

export interface RefreshSessionAction {
  type: 'robot:REFRESH_SESSION'
  meta: { robotCommand: true }
}

export type CalibrationResponseAction =
  | CalibrationSuccessAction
  | CalibrationFailureAction

export interface SetModulesReviewedAction {
  type: 'robot:SET_MODULES_REVIEWED'
  payload: boolean
}

export interface ClearCalibrationRequestAction {
  type: 'robot:CLEAR_CALIBRATION_REQUEST'
}

export interface SetDeckPopulatedAction {
  type: 'robot:SET_DECK_POPULATED'
  payload: boolean
}

export interface MoveToFrontAction {
  type: 'robot:MOVE_TO_FRONT'
  payload: { mount: Mount }
  meta: { robotCommand: true }
}

export interface MoveToFrontResponseAction {
  type: 'robot:MOVE_TO_FRONT_RESPONSE'
  error: boolean
  payload?: Error
}

export interface ProbeTipAction {
  type: 'robot:PROBE_TIP'
  payload: { mount: Mount }
  meta: { robotCommand: true }
}

export interface ProbeTipResponseAction {
  type: 'robot:PROBE_TIP_RESPONSE'
  error: boolean
  payload?: Error
}

export interface ConfirmLabwareAction {
  type: 'robot:CONFIRM_LABWARE'
  payload: { labware: Slot }
}

export interface RunAction {
  type: 'robot:RUN'
  meta: { robotCommand: true }
}

export interface RunResponseAction {
  type: 'robot:RUN_RESPONSE'
  error: boolean
  payload?: Error
}

export interface PauseAction {
  type: 'robot:PAUSE'
  meta: { robotCommand: true }
}

export interface PauseResponseAction {
  type: 'robot:PAUSE_RESPONSE'
  error: boolean
  payload?: Error
}

export interface ResumeAction {
  type: 'robot:RESUME'
  meta: { robotCommand: true }
}

export interface ResumeResponseAction {
  type: 'robot:RESUME_RESPONSE'
  error: boolean
  payload?: Error
}

export interface CancelAction {
  type: 'robot:CANCEL'
  meta: { robotCommand: true }
}

export interface CancelResponseAction {
  type: 'robot:CANCEL_RESPONSE'
  error: boolean
  payload?: Error
}

// TODO(mc, 2018-01-23): refactor to use type above
//   DO NOT ADD NEW ACTIONS HERE
export const actionTypes = {
  // calibration
  SET_DECK_POPULATED: 'robot:SET_DECK_POPULATED',
  // TODO(mc, 2018-01-10): rename MOVE_TO_FRONT to PREPARE_TO_PROBE?
  MOVE_TO_FRONT: 'robot:MOVE_TO_FRONT',
  MOVE_TO_FRONT_RESPONSE: 'robot:MOVE_TO_FRONT_RESPONSE',
  PROBE_TIP: 'robot:PROBE_TIP',
  PROBE_TIP_RESPONSE: 'robot:PROBE_TIP_RESPONSE',

  RETURN_TIP: 'robot:RETURN_TIP',
  RETURN_TIP_RESPONSE: 'robot:RETURN_TIP_RESPONSE',
  CONFIRM_LABWARE: 'robot:CONFIRM_LABWARE',

  // protocol run controls
  RUN: 'robot:RUN',
  RUN_RESPONSE: 'robot:RUN_RESPONSE',
  PAUSE: 'robot:PAUSE',
  PAUSE_RESPONSE: 'robot:PAUSE_RESPONSE',
  RESUME: 'robot:RESUME',
  RESUME_RESPONSE: 'robot:RESUME_RESPONSE',
  CANCEL: 'robot:CANCEL',
  CANCEL_RESPONSE: 'robot:CANCEL_RESPONSE',
} as const

// TODO(mc, 2018-01-23): NEW ACTION TYPES GO HERE
export type Action =
  | ConnectAction
  | ConnectResponseAction
  | DisconnectAction
  | DisconnectResponseAction
  | ClearConnectResponseAction
  | UnexpectedDisconnectAction
  | ConfirmProbedAction
  | PipetteCalibrationAction
  | LabwareCalibrationAction
  | CalibrationResponseAction
  | CalibrationFailureAction
  | ReturnTipAction
  | ReturnTipResponseAction
  | SetJogDistanceAction
  | SessionResponseAction
  | SessionErrorAction
  | SessionUpdateAction
  | RefreshSessionAction
  | SetModulesReviewedAction
  | ClearCalibrationRequestAction
  | SetDeckPopulatedAction
  | MoveToFrontAction
  | MoveToFrontResponseAction
  | ProbeTipAction
  | ProbeTipResponseAction
  | ConfirmLabwareAction
  | RunAction
  | RunResponseAction
  | PauseAction
  | PauseResponseAction
  | ResumeAction
  | ResumeResponseAction
  | CancelAction
  | CancelResponseAction

export const actions = {
  connect(name: string): ConnectAction {
    return {
      type: 'robot:CONNECT',
      payload: { name },
      meta: { robotCommand: true },
    }
  },

  connectResponse(
    error: Error | null,
    sessionCapabilities: string[] = []
  ): ConnectResponseAction {
    return {
      type: 'robot:CONNECT_RESPONSE',
      payload: { error, sessionCapabilities },
    }
  },

  clearConnectResponse(): ClearConnectResponseAction {
    return { type: 'robot:CLEAR_CONNECT_RESPONSE' }
  },

  disconnect(): DisconnectAction {
    return { type: 'robot:DISCONNECT', meta: { robotCommand: true } }
  },

  disconnectResponse(): DisconnectResponseAction {
    return {
      type: 'robot:DISCONNECT_RESPONSE',
      payload: {},
    }
  },

  unexpectedDisconnect(): UnexpectedDisconnectAction {
    return { type: 'robot:UNEXPECTED_DISCONNECT' }
  },

  sessionResponse(
    error: Error | null | undefined,
    // TODO(mc, 2018-01-23): type Session (see reducers/session.js)
    session: any,
    freshUpload: boolean
  ): SessionResponseAction | SessionErrorAction {
    const meta = { freshUpload }

    if (error) {
      return { type: 'robot:SESSION_ERROR', payload: { error }, meta }
    }

    return { type: 'robot:SESSION_RESPONSE', payload: session, meta }
  },

  sessionUpdate(update: SessionUpdate, now: number): SessionUpdateAction {
    return {
      type: 'robot:SESSION_UPDATE',
      payload: update,
      meta: { now },
    }
  },

  setModulesReviewed(payload: boolean): SetModulesReviewedAction {
    return { type: 'robot:SET_MODULES_REVIEWED', payload }
  },

  setDeckPopulated(payload: boolean): SetDeckPopulatedAction {
    return { type: actionTypes.SET_DECK_POPULATED, payload }
  },

  // pick up a tip with instrument on `mount` from tiprack in `slot`
  pickupAndHome(mount: Mount, slot: Slot): LabwareCalibrationAction {
    return {
      type: 'robot:PICKUP_AND_HOME',
      payload: { mount, slot },
      meta: { robotCommand: true },
    }
  },

  // response for pickup and home
  pickupAndHomeResponse(
    error: Error | null | undefined = null
  ): CalibrationResponseAction {
    if (error) {
      return {
        type: 'robot:PICKUP_AND_HOME_FAILURE',
        error: true,
        payload: error,
      }
    }

    return {
      type: 'robot:PICKUP_AND_HOME_SUCCESS',
      payload: {},
    }
  },

  // drop the tip on pipette on `mount` into the tiprack in `slot`
  dropTipAndHome(mount: Mount, slot: Slot): LabwareCalibrationAction {
    return {
      type: 'robot:DROP_TIP_AND_HOME',
      payload: { mount, slot },
      meta: { robotCommand: true },
    }
  },

  // response for drop tip and home
  dropTipAndHomeResponse(
    error: Error | null | undefined = null
  ): CalibrationResponseAction {
    if (error) {
      return {
        type: 'robot:DROP_TIP_AND_HOME_FAILURE',
        error: true,
        payload: error,
      }
    }

    return {
      type: 'robot:DROP_TIP_AND_HOME_SUCCESS',
      payload: {},
    }
  },

  // set tiprack to calibrated and conditionally drop the tip
  confirmTiprack(mount: Mount, slot: Slot): LabwareCalibrationAction {
    return {
      type: 'robot:CONFIRM_TIPRACK',
      payload: { mount, slot },
      meta: { robotCommand: true },
    }
  },

  // response for pickup and home
  // payload.tipOn is a flag for whether a tip remains on the pipette
  confirmTiprackResponse(
    error: Error | null | undefined = null,
    tipOn: boolean = false
  ): CalibrationResponseAction {
    if (error) {
      return {
        type: 'robot:CONFIRM_TIPRACK_FAILURE',
        error: true,
        payload: error,
      }
    }

    return {
      type: 'robot:CONFIRM_TIPRACK_SUCCESS',
      payload: { tipOn },
    }
  },

  moveToFront(mount: Mount): MoveToFrontAction {
    return {
      type: actionTypes.MOVE_TO_FRONT,
      payload: { mount },
      meta: { robotCommand: true },
    }
  },

  moveToFrontResponse(
    error: Error | null | undefined = null
  ): MoveToFrontResponseAction {
    const action: MoveToFrontResponseAction = {
      type: actionTypes.MOVE_TO_FRONT_RESPONSE,
      error: error != null,
    }
    if (error) action.payload = error

    return action
  },

  probeTip(mount: Mount): ProbeTipAction {
    return {
      type: actionTypes.PROBE_TIP,
      payload: { mount },
      meta: { robotCommand: true },
    }
  },

  probeTipResponse(
    error: Error | null | undefined = null
  ): ProbeTipResponseAction {
    const action: ProbeTipResponseAction = {
      type: actionTypes.PROBE_TIP_RESPONSE,
      error: error != null,
    }
    if (error) action.payload = error

    return action
  },

  // confirm tip removed + tip probed then home pipette on `mount`
  confirmProbed(mount: Mount): ConfirmProbedAction {
    return {
      type: 'robot:CONFIRM_PROBED',
      payload: mount,
      meta: { robotCommand: true },
    }
  },

  returnTip(mount: Mount): ReturnTipAction {
    return {
      type: actionTypes.RETURN_TIP,
      payload: { mount },
      meta: { robotCommand: true },
    }
  },

  returnTipResponse(
    error: Error | null | undefined = null
  ): ReturnTipResponseAction {
    const action: ReturnTipResponseAction = {
      type: actionTypes.RETURN_TIP_RESPONSE,
      error: error != null,
    }
    if (error) action.payload = error

    return action
  },

  moveTo(mount: Mount, slot: Slot): LabwareCalibrationAction {
    return {
      type: 'robot:MOVE_TO',
      payload: { mount, slot },
      meta: { robotCommand: true },
    }
  },

  moveToResponse(
    error: Error | null | undefined = null
  ): CalibrationResponseAction {
    if (error) {
      return {
        type: 'robot:MOVE_TO_FAILURE',
        error: true,
        payload: error,
      }
    }

    return { type: 'robot:MOVE_TO_SUCCESS', payload: {} }
  },

  setJogDistance(step: number): SetJogDistanceAction {
    return { type: 'robot:SET_JOG_DISTANCE', payload: step }
  },

  jog(
    mount: Mount,
    axis: Axis,
    direction: Direction,
    step: number
  ): PipetteCalibrationAction {
    return {
      type: 'robot:JOG',
      payload: { mount, axis, direction, step },
      meta: { robotCommand: true },
    }
  },

  jogResponse(
    error: Error | null | undefined = null
  ): CalibrationResponseAction {
    if (error) {
      return {
        type: 'robot:JOG_FAILURE',
        error: true,
        payload: error,
      }
    }

    return { type: 'robot:JOG_SUCCESS', payload: {} }
  },

  // update the offset of labware in slot using position of pipette on mount
  updateOffset(mount: Mount, slot: Slot): LabwareCalibrationAction {
    return {
      type: 'robot:UPDATE_OFFSET',
      payload: { mount, slot },
      meta: { robotCommand: true },
    }
  },

  // response for updateOffset
  updateOffsetResponse(
    error: Error | null | undefined = null
  ): CalibrationResponseAction {
    if (error) {
      return {
        type: 'robot:UPDATE_OFFSET_FAILURE',
        error: true,
        payload: error,
      }
    }

    return {
      type: 'robot:UPDATE_OFFSET_SUCCESS',
      payload: {},
    }
  },

  confirmLabware(labware: Slot): ConfirmLabwareAction {
    return { type: actionTypes.CONFIRM_LABWARE, payload: { labware } }
  },

  run(): RunAction {
    return { type: actionTypes.RUN, meta: { robotCommand: true } }
  },

  runResponse(error: Error | null | undefined = null): RunResponseAction {
    const action: RunResponseAction = {
      type: actionTypes.RUN_RESPONSE,
      error: error != null,
    }
    if (error) action.payload = error

    return action
  },

  pause(): PauseAction {
    return { type: actionTypes.PAUSE, meta: { robotCommand: true } }
  },

  pauseResponse(error: Error | null | undefined = null): PauseResponseAction {
    const action: PauseResponseAction = {
      type: actionTypes.PAUSE_RESPONSE,
      error: error != null,
    }
    if (error) action.payload = error

    return action
  },

  resume(): ResumeAction {
    return { type: actionTypes.RESUME, meta: { robotCommand: true } }
  },

  resumeResponse(error: Error | null | undefined = null): ResumeResponseAction {
    const action: ResumeResponseAction = {
      type: actionTypes.RESUME_RESPONSE,
      error: error != null,
    }
    if (error) action.payload = error

    return action
  },

  cancel(): CancelAction {
    return { type: actionTypes.CANCEL, meta: { robotCommand: true } }
  },

  cancelResponse(error: Error | null | undefined = null): CancelResponseAction {
    const action: CancelResponseAction = {
      type: actionTypes.CANCEL_RESPONSE,
      error: error != null,
    }
    if (error) action.payload = error

    return action
  },

  refreshSession(): RefreshSessionAction {
    return { type: 'robot:REFRESH_SESSION', meta: { robotCommand: true } }
  },

  clearCalibrationRequest(): ClearCalibrationRequestAction {
    return { type: 'robot:CLEAR_CALIBRATION_REQUEST' }
  },
}
