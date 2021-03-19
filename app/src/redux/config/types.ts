// @flow
import typeof {
  INITIALIZED,
  VALUE_UPDATED,
  UPDATE_VALUE,
  RESET_VALUE,
  TOGGLE_VALUE,
  ADD_UNIQUE_VALUE,
  SUBTRACT_VALUE,
} from './constants'

import type { Config } from './schema-types'
export type * from './schema-types'

export type ConfigState = Config | null

export type ConfigInitializedAction = {|
  type: INITIALIZED,
  payload: {| config: Config |},
|}

export type ConfigValueUpdatedAction = {|
  type: VALUE_UPDATED,
  payload: {| path: string, value: any |},
|}

export type UpdateConfigValueAction = {|
  type: UPDATE_VALUE,
  payload: {| path: string, value: mixed |},
  meta: {| shell: true |},
|}

export type ResetConfigValueAction = {|
  type: RESET_VALUE,
  payload: {| path: string |},
  meta: {| shell: true |},
|}

export type ToggleConfigValueAction = {|
  type: TOGGLE_VALUE,
  payload: {| path: string |},
  meta: {| shell: true |},
|}

export type AddUniqueConfigValueAction = {|
  type: ADD_UNIQUE_VALUE,
  payload: {| path: string, value: mixed |},
  meta: {| shell: true |},
|}

export type SubtractConfigValueAction = {|
  type: SUBTRACT_VALUE,
  payload: {| path: string, value: mixed |},
  meta: {| shell: true |},
|}

export type ConfigValueChangeAction =
  | UpdateConfigValueAction
  | ResetConfigValueAction
  | ToggleConfigValueAction
  | AddUniqueConfigValueAction
  | SubtractConfigValueAction

export type ConfigAction =
  | ConfigValueChangeAction
  | ConfigValueUpdatedAction
  | ConfigInitializedAction
