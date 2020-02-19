// @flow
import type { RobotApiRequestMeta } from '../robot-api/types'

// common types

export type RobotAdminStatus =
  | 'up'
  | 'down'
  | 'restart-pending'
  | 'restarting'
  | 'restart-failed'

export type ResetConfigOption = {|
  id: string,
  name: string,
  description: string,
|}

export type ResetConfigRequest = $Shape<{|
  [optionId: string]: boolean,
|}>

// action types

export type RestartRobotAction = {|
  type: 'robotAdmin:RESTART',
  payload: {| robotName: string |},
  meta: $Shape<{| ...RobotApiRequestMeta, robot: true |}>,
|}

export type RestartRobotSuccessAction = {|
  type: 'robotAdmin:RESTART_SUCCESS',
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type RestartRobotFailureAction = {|
  type: 'robotAdmin:RESTART_FAILURE',
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

export type FetchResetConfigOptionsAction = {|
  type: 'robotAdmin:FETCH_RESET_CONFIG_OPTIONS',
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchResetConfigOptionsSuccessAction = {|
  type: 'robotAdmin:FETCH_RESET_CONFIG_OPTIONS_SUCCESS',
  payload: {| robotName: string, options: Array<ResetConfigOption> |},
  meta: RobotApiRequestMeta,
|}

export type FetchResetConfigOptionsFailureAction = {|
  type: 'robotAdmin:FETCH_RESET_CONFIG_OPTIONS_FAILURE',
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

export type ResetConfigAction = {|
  type: 'robotAdmin:RESET_CONFIG',
  payload: {| robotName: string, resets: ResetConfigRequest |},
  meta: RobotApiRequestMeta,
|}

export type ResetConfigSuccessAction = {|
  type: 'robotAdmin:RESET_CONFIG_SUCCESS',
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type ResetConfigFailureAction = {|
  type: 'robotAdmin:RESET_CONFIG_FAILURE',
  payload: {| robotName: string, error: {} |},
  meta: RobotApiRequestMeta,
|}

export type RobotAdminAction =
  | RestartRobotAction
  | RestartRobotSuccessAction
  | RestartRobotFailureAction
  | FetchResetConfigOptionsAction
  | FetchResetConfigOptionsSuccessAction
  | FetchResetConfigOptionsFailureAction
  | ResetConfigAction
  | ResetConfigSuccessAction
  | ResetConfigFailureAction

// state types

export type PerRobotAdminState = $Shape<{|
  status: RobotAdminStatus,
  resetConfigOptions: Array<ResetConfigOption>,
|}>

export type RobotAdminState = $Shape<{|
  [robotName: string]: void | PerRobotAdminState,
|}>
