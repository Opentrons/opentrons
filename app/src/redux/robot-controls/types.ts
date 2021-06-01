import type { RobotApiRequestMeta } from '../robot-api/types'
import type { Mount } from '../pipettes/types'

// common types

export type MovementStatus = 'homing' | 'homeError' | 'moving' | 'moveError'

export type MovePosition = 'changePipette' | 'attachTip'

// http responses

export interface PositionsResponse {
  positions: {
    change_pipette: {
      target: 'mount'
      left: [number, number, number]
      right: [number, number, number]
    }
    attach_tip: { target: 'pipette'; point: [number, number, number] }
  }
}

// action types

// fetch lights

export interface FetchLightsAction {
  type: 'robotControls:FETCH_LIGHTS'
  payload: { robotName: string }
  meta: RobotApiRequestMeta | {}
}

export interface FetchLightsSuccessAction {
  type: 'robotControls:FETCH_LIGHTS_SUCCESS'
  payload: { robotName: string; lightsOn: boolean }
  meta: RobotApiRequestMeta
}

export interface FetchLightsFailureAction {
  type: 'robotControls:FETCH_LIGHTS_FAILURE'
  payload: { robotName: string; error: { message: string } }
  meta: RobotApiRequestMeta
}

// update lights

export interface UpdateLightsAction {
  type: 'robotControls:UPDATE_LIGHTS'
  payload: { robotName: string; lightsOn: boolean }
  meta: RobotApiRequestMeta
}

export interface UpdateLightsSuccessAction {
  type: 'robotControls:UPDATE_LIGHTS_SUCCESS'
  payload: { robotName: string; lightsOn: boolean }
  meta: RobotApiRequestMeta
}

export interface UpdateLightsFailureAction {
  type: 'robotControls:UPDATE_LIGHTS_FAILURE'
  payload: { robotName: string; error: { message: string } }
  meta: RobotApiRequestMeta
}

// home

export interface HomeAction {
  type: 'robotControls:HOME'
  payload:
    | { robotName: string; target: 'robot' }
    | { robotName: string; target: 'pipette'; mount: Mount }
  meta: RobotApiRequestMeta | {}
}

export interface HomeSuccessAction {
  type: 'robotControls:HOME_SUCCESS'
  payload: { robotName: string }
  meta: RobotApiRequestMeta
}

export interface HomeFailureAction {
  type: 'robotControls:HOME_FAILURE'
  payload: { robotName: string; error: { message: string } }
  meta: RobotApiRequestMeta
}

// move

export interface MoveAction {
  type: 'robotControls:MOVE'
  payload: {
    robotName: string
    mount: Mount
    position: MovePosition
    disengageMotors: boolean
  }
  meta: RobotApiRequestMeta | {}
}

export interface MoveSuccessAction {
  type: 'robotControls:MOVE_SUCCESS'
  payload: { robotName: string }
  meta: RobotApiRequestMeta
}

export interface MoveFailureAction {
  type: 'robotControls:MOVE_FAILURE'
  payload: { robotName: string; error: { message: string } }
  meta: RobotApiRequestMeta
}

// clear homing and movement status and error

export interface ClearMovementStatusAction {
  type: 'robotControls:CLEAR_MOVEMENT_STATUS'
  payload: { robotName: string }
}

// action union

export type RobotControlsAction =
  | FetchLightsAction
  | FetchLightsSuccessAction
  | FetchLightsFailureAction
  | UpdateLightsAction
  | UpdateLightsSuccessAction
  | UpdateLightsFailureAction
  | HomeAction
  | HomeSuccessAction
  | HomeFailureAction
  | MoveAction
  | MoveSuccessAction
  | MoveFailureAction
  | ClearMovementStatusAction

// state types

export type PerRobotControlsState = Readonly<{
  lightsOn: boolean | null
  movementStatus: MovementStatus | null
  movementError: string | null
}>

export type RobotControlsState = Partial<
  Readonly<{
    [robotName: string]: undefined | PerRobotControlsState
  }>
>
