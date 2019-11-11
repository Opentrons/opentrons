// @flow
import type { ModulesState, SettingsState } from './resources/types'

// TODO(mc, 2019-11-12): deprecated, remove when able
export * from './resources/types'

export type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

// TODO(mc, 2019-11-12): deprecated, remove when able
export type RequestMeta = $Shape<{| [string]: mixed |}>

// api call + response types

export type RobotHost = {
  name: string,
  ip: string,
  port: number,
}

// TODO(mc, 2019-11-12): deprecated, to be replaced by HostlessRobotApiRequest
export type RobotApiRequest = {|
  host: RobotHost,
  method: Method,
  path: string,
  body?: mixed,
  query?: { [param: string]: string | boolean | number },
|}

export type RobotApiResponse = {|
  host: RobotHost,
  path: string,
  method: Method,
  body: any,
  status: number,
  ok: boolean,
|}

// TODO(mc, 2019-11-12): rename to RobotApiRequest
export type HostlessRobotApiRequest = {|
  method: Method,
  path: string,
  body?: mixed,
  query?: { [param: string]: string | boolean | number },
|}

export type RobotApiRequestMeta = $Shape<{|
  requestId: string,
  response: {|
    method: Method,
    path: string,
    status: number,
    ok: boolean,
  |},
|}>

// action types

export type DeprecatedRobotApiAction =
  | {| type: 'robotApi:FETCH_MODULES', payload: RobotApiRequest |}
  | {|
      type: 'robotApi:FETCH_MODULE_DATA',
      payload: RobotApiRequest,
      meta: {| id: string |},
    |}
  | {|
      type: 'robotApi:SEND_MODULE_COMMAND',
      payload: RobotApiRequest,
      meta: {| id: string |},
    |}
  | {| type: 'robotApi:FETCH_PIPETTE_SETTINGS', payload: RobotApiRequest |}
  | {|
      type: 'robotApi:SET_PIPETTE_SETTINGS',
      payload: RobotApiRequest,
      meta: {| id: string |},
    |}

export type RobotApiActionType = $PropertyType<DeprecatedRobotApiAction, 'type'>

// TODO(mc, 2019-11-12): deprecated, remove when able
// internal, request lifecycle types
// only for use inside observables
export type RobotApiRequestAction = {|
  type: string,
  payload: RobotApiRequest,
  meta: RequestMeta,
|}

// TODO(mc, 2019-11-12): deprecated, remove when able
export type RobotApiResponseAction = {|
  type: string,
  payload: RobotApiResponse,
  meta: RequestMeta,
|}

// TODO(mc, 2019-11-12): deprecated, remove when able
export type RobotApiActionLike = {|
  type: string,
  payload: RobotApiRequest | RobotApiResponse,
  meta?: RequestMeta,
|}

// instance state shapes

// TODO(mc, 2019-11-12): deprecated, remove when able
export type RobotApiRequestState = {|
  response: RobotApiResponse | null,
|}

// TODO(mc, 2019-11-12): deprecated, remove when able
export type RobotInstanceNetworkingState = {
  [path: string]: ?RobotApiRequestState,
}

// TODO(mc, 2019-11-12): deprecated, remove when able
export type RobotInstanceResourcesState = {|
  modules: ModulesState,
  settings: SettingsState,
|}

// TODO(mc, 2019-11-12): deprecated, remove when able
export type RobotInstanceApiState = {|
  networking: RobotInstanceNetworkingState,
  resources: RobotInstanceResourcesState,
|}

export type RequestState =
  | $ReadOnly<{| status: 'pending' |}>
  | $ReadOnly<{| status: 'success', response: RobotApiResponse |}>
  | $ReadOnly<{| status: 'failure', response: RobotApiResponse |}>

// overall API state

// TODO(mc, 2019-11-12): deprecated, remove when able
export type DeprecatedRobotApiState = {
  [robotName: string]: ?RobotInstanceApiState,
}

export type RobotApiState = $Shape<
  $ReadOnly<{|
    [requestId: string]: void | RequestState,
  |}>
>
