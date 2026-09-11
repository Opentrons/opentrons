import type {
  ADD_UNIQUE_VALUE,
  INITIALIZED,
  RESET_VALUE,
  SUBTRACT_VALUE,
  TOGGLE_VALUE,
  UPDATE_VALUE,
  VALUE_UPDATED,
} from './constants'
import type { Config } from './schema-types'

export * from './schema-types'

export type ConfigState = Config | null

export interface ConfigInitializedAction {
  type: typeof INITIALIZED
  payload: { config: Config }
  meta: { shell: true }
}

export interface ConfigValueUpdatedAction {
  type: typeof VALUE_UPDATED
  payload: { path: string; value: any }
  meta: { shell: true }
}

export interface UpdateConfigValueAction {
  type: typeof UPDATE_VALUE
  payload: { path: string; value: unknown }
  meta: { shell: true }
}

export interface ResetConfigValueAction {
  type: typeof RESET_VALUE
  payload: { path: string }
  meta: { shell: true }
}

export interface ToggleConfigValueAction {
  type: typeof TOGGLE_VALUE
  payload: { path: string }
  meta: { shell: true }
}

export interface AddUniqueConfigValueAction {
  type: typeof ADD_UNIQUE_VALUE
  payload: { path: string; value: unknown }
  meta: { shell: true }
}

export interface SubtractConfigValueAction {
  type: typeof SUBTRACT_VALUE
  payload: { path: string; value: unknown }
  meta: { shell: true }
}

export type ConfigValueChangeAction =
  | UpdateConfigValueAction
  | ResetConfigValueAction
  | ToggleConfigValueAction
  | AddUniqueConfigValueAction
  | SubtractConfigValueAction

export type ConfigAction =
  ConfigValueChangeAction | ConfigValueUpdatedAction | ConfigInitializedAction
