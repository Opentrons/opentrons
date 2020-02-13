// @flow

import type { RobotApiRequestMeta } from '../robot-api/types'

export type RobotSettingsField = {|
  id: string,
  title: string,
  description: string,
  value: boolean | null,
  restart_required?: boolean,
|}

export type RobotSettings = Array<RobotSettingsField>

export type RobotSettingsResponse = {|
  settings: RobotSettings,
  links?: {| restart?: string |},
|}

export type PerRobotRobotSettingsState = {|
  settings: RobotSettings,
  restartPath: string | null,
|}

export type RobotSettingsState = $Shape<{|
  [robotName: string]: void | PerRobotRobotSettingsState,
|}>

export type RobotSettingsFieldUpdate = {|
  id: $PropertyType<RobotSettingsField, 'id'>,
  value: $PropertyType<RobotSettingsField, 'value'>,
|}

// action types

// fetch settings

export type FetchSettingsAction = {|
  type: 'robotSettings:FETCH_SETTINGS',
  payload: {| robotName: string |},
  meta: RobotApiRequestMeta,
|}

export type FetchSettingsSuccessAction = {|
  type: 'robotSettings:FETCH_SETTINGS_SUCCESS',
  payload: {|
    robotName: string,
    settings: RobotSettings,
    restartPath: string | null,
  |},
  meta: RobotApiRequestMeta,
|}

export type FetchSettingsFailureAction = {|
  type: 'robotSettings:FETCH_SETTINGS_FAILURE',
  payload: {| robotName: string, error: {| message: string |} |},
  meta: RobotApiRequestMeta,
|}

// update setting

export type UpdateSettingAction = {|
  type: 'robotSettings:UPDATE_SETTING',
  payload: {| robotName: string, settingId: string, value: boolean | null |},
  meta: RobotApiRequestMeta,
|}

export type UpdateSettingSuccessAction = {|
  type: 'robotSettings:UPDATE_SETTING_SUCCESS',
  payload: {|
    robotName: string,
    settings: RobotSettings,
    restartPath: string | null,
  |},
  meta: RobotApiRequestMeta,
|}

export type UpdateSettingFailureAction = {|
  type: 'robotSettings:UPDATE_SETTING_FAILURE',
  payload: {| robotName: string, error: {| message: string |} |},
  meta: RobotApiRequestMeta,
|}

// clear restart path

export type ClearRestartPathAction = {|
  type: 'robotSettings:CLEAR_RESTART_PATH',
  payload: { robotName: string },
|}

export type RobotSettingsAction =
  | ClearRestartPathAction
  | FetchSettingsAction
  | FetchSettingsSuccessAction
  | FetchSettingsFailureAction
  | UpdateSettingAction
  | UpdateSettingSuccessAction
  | UpdateSettingFailureAction
