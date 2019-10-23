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

export type PerRobotRobotSettingsState = {|
  settings: RobotSettings,
  restartRequired: boolean,
|}

export type RobotSettingsState = $Shape<{|
  [robotName: string]: void | PerRobotRobotSettingsState,
|}>

export type RobotSettingsFieldUpdate = {|
  id: $PropertyType<RobotSettingsField, 'id'>,
  value: $PropertyType<RobotSettingsField, 'value'>,
|}

export type RobotSettingsApiAction =
  | {| type: 'robotSettings:FETCH_SETTINGS', payload: RobotApiRequest |}
  | {|
      type: 'robotSettings:UPDATE_SETTING',
      payload: RobotApiRequest,
      meta: {| settingId: string |},
    |}

export type RobotSettingsAction =
  | RobotSettingsApiAction
  | {|
      type: 'robotSettings:CLEAR_RESTART_REQUIRED',
      payload: {| robotName: string |},
    |}
