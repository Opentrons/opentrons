import type {
  RobotSettings,
  RobotSettingsField,
  RobotSettingsResponse,
} from '@opentrons/api-client'
import type { RobotApiRequestMeta } from '../robot-api/types'

export interface PerRobotRobotSettingsState {
  settings: RobotSettings
  restartPath: string | null
}

export type RobotSettingsState = Partial<{
  [robotName: string]: undefined | PerRobotRobotSettingsState
}>

export interface RobotSettingsFieldUpdate {
  id: RobotSettingsField['id']
  value: RobotSettingsField['value']
}

// action types

// fetch settings

export interface FetchSettingsAction {
  type: 'robotSettings:FETCH_SETTINGS'
  payload: { robotName: string }
  meta: RobotApiRequestMeta | {}
}

export interface FetchSettingsSuccessAction {
  type: 'robotSettings:FETCH_SETTINGS_SUCCESS'
  payload: {
    robotName: string
    settings: RobotSettings
    restartPath: string | null
  }
  meta: RobotApiRequestMeta
}

export interface FetchSettingsFailureAction {
  type: 'robotSettings:FETCH_SETTINGS_FAILURE'
  payload: { robotName: string; error: { message: string } }
  meta: RobotApiRequestMeta
}

// update setting

export interface UpdateSettingAction {
  type: 'robotSettings:UPDATE_SETTING'
  payload: { robotName: string; settingId: string; value: boolean | null }
  meta: RobotApiRequestMeta | {}
}

export interface UpdateSettingSuccessAction {
  type: 'robotSettings:UPDATE_SETTING_SUCCESS'
  payload: {
    robotName: string
    settings: RobotSettings
    restartPath: string | null
  }
  meta: RobotApiRequestMeta
}

export interface UpdateSettingFailureAction {
  type: 'robotSettings:UPDATE_SETTING_FAILURE'
  payload: { robotName: string; error: { message: string } }
  meta: RobotApiRequestMeta
}

// clear restart path

export interface ClearRestartPathAction {
  type: 'robotSettings:CLEAR_RESTART_PATH'
  payload: { robotName: string }
}

export type RobotSettingsAction =
  | ClearRestartPathAction
  | FetchSettingsAction
  | FetchSettingsSuccessAction
  | FetchSettingsFailureAction
  | UpdateSettingAction
  | UpdateSettingSuccessAction
  | UpdateSettingFailureAction

// TODO(bh, 2024-03-26): update type imports elsewhere to @opentrons/api-client
export type { RobotSettings, RobotSettingsField, RobotSettingsResponse }
