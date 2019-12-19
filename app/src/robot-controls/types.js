// @flow

import type { RobotApiRequestMeta } from '../robot-api/types'
import type { Mount } from '../pipettes/types'

// common types

export type MovementStatus = 'homing' | 'home-error' | 'moving' | 'move-error'

// action types

// fetch lights

export type FetchLightsAction = {|
  type: 'robotControls:FETCH_LIGHTS',
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchLightsSuccessAction = {|
  type: 'robotControls:FETCH_LIGHTS_SUCCESS',
  payload: {| robotName: string, lightsOn: boolean |},
  meta: RobotApiRequestMeta,
|}

export type FetchLightsFailureAction = {|
  type: 'robotControls:FETCH_LIGHTS_FAILURE',
  payload: {| robotName: string, error: {| message: string |} |},
  meta: RobotApiRequestMeta,
|}

export type FetchLightsDoneAction =
  | FetchLightsSuccessAction
  | FetchLightsFailureAction

// update lights

export type UpdateLightsAction = {|
  type: 'robotControls:UPDATE_LIGHTS',
  payload: {| robotName: string, lightsOn: boolean |},
  meta: RobotApiRequestMeta,
|}

export type UpdateLightsSuccessAction = {|
  type: 'robotControls:UPDATE_LIGHTS_SUCCESS',
  payload: {| robotName: string, lightsOn: boolean |},
  meta: RobotApiRequestMeta,
|}

export type UpdateLightsFailureAction = {|
  type: 'robotControls:UPDATE_LIGHTS_FAILURE',
  payload: {| robotName: string, error: {| message: string |} |},
  meta: RobotApiRequestMeta,
|}

export type UpdateLightsDoneAction =
  | UpdateLightsSuccessAction
  | UpdateLightsFailureAction

// home

export type HomeAction = {|
  type: 'robotControls:HOME',
  payload:
    | {| robotName: string, target: 'robot' |}
    | {| robotName: string, target: 'pipette', mount: Mount |},
  meta: RobotApiRequestMeta,
|}

export type HomeSuccessAction = {|
  type: 'robotControls:HOME_SUCCESS',
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type HomeFailureAction = {|
  type: 'robotControls:HOME_FAILURE',
  payload: {| robotName: string, error: {| message: string |} |},
  meta: RobotApiRequestMeta,
|}

export type HomeDoneAction = HomeSuccessAction | HomeFailureAction

// clear homing and movement status and error

export type ClearMovementStatusAction = {|
  type: 'robotControls:CLEAR_MOVEMENT_STATUS',
  payload: {| robotName: string |},
|}

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
  | ClearMovementStatusAction

// state types

export type PerRobotControlsState = $ReadOnly<{|
  lightsOn: boolean | null,
  movementStatus: MovementStatus | null,
  movementError: string | null,
|}>

export type RobotControlsState = $Shape<
  $ReadOnly<{|
    [robotName: string]: void | PerRobotControlsState,
  |}>
>
