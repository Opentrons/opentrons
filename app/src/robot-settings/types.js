// @flow

import type { RobotApiRequest } from '../robot-api/types'

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

export type ClearRestartPathAction = {|
  type: 'robotSettings:CLEAR_RESTART_PATH',
  payload: { robotName: string },
|}

export type RobotSettingsApiAction =
  | {| type: 'robotSettings:FETCH_SETTINGS', payload: RobotApiRequest |}
  | {| type: 'robotSettings:UPDATE_SETTING', payload: RobotApiRequest |}

export type RobotSettingsAction =
  | ClearRestartPathAction
  | RobotSettingsApiAction
