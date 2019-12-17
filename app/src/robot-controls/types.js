// @flow

import type { RobotApiRequestMeta } from '../robot-api/types'

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
  payload: {| robotName: string, error: {} |},
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
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

export type UpdateLightsDoneAction =
  | UpdateLightsSuccessAction
  | UpdateLightsFailureAction

// action union

export type RobotControlsAction =
  | FetchLightsAction
  | FetchLightsSuccessAction
  | FetchLightsFailureAction
  | UpdateLightsAction
  | UpdateLightsSuccessAction
  | UpdateLightsFailureAction

// state types

export type PerRobotControlsState = $ReadOnly<{|
  lightsOn: boolean | null,
|}>

export type RobotControlsState = $Shape<
  $ReadOnly<{|
    [robotName: string]: void | PerRobotControlsState,
  |}>
>
