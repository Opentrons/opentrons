// @flow
export type * from './schema-types'

export type UpdateConfigAction = {|
  type: 'config:UPDATE',
  payload: {| path: string, value: any |},
  meta: {| shell: true |},
|}

export type ResetConfigAction = {|
  type: 'config:RESET',
  payload: {| path: string |},
  meta: {| shell: true |},
|}

export type SetConfigAction = {|
  type: 'config:SET',
  payload: {|
    path: string,
    value: any,
  |},
|}

export type ConfigAction =
  | UpdateConfigAction
  | ResetConfigAction
  | SetConfigAction
