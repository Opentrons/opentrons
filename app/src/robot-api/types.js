// @flow
import type {
  HealthState,
  ModulesState,
  PipettesState,
  SettingsState,
} from './resources/types'

export * from './resources/types'

export type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

export type RequestMeta = $Shape<{| [string]: mixed |}>

// api call + response types

export type RobotHost = {
  name: string,
  ip: string,
  port: number,
}

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

// action types

export type RobotApiAction =
  | {| type: 'robotApi:FETCH_HEALTH', payload: RobotApiRequest |}
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
  | {| type: 'robotApi:FETCH_PIPETTES', payload: RobotApiRequest |}
  | {| type: 'robotApi:FETCH_PIPETTE_SETTINGS', payload: RobotApiRequest |}
  | {|
      type: 'robotApi:SET_PIPETTE_SETTINGS',
      payload: RobotApiRequest,
      meta: {| id: string |},
    |}

export type RobotApiActionType = $PropertyType<RobotApiAction, 'type'>

// internal, request lifecycle types
// only for use inside observables
export type RobotApiRequestAction = {|
  type: string,
  payload: RobotApiRequest,
  meta: RequestMeta,
|}

export type RobotApiResponseAction = {|
  type: string,
  payload: RobotApiResponse,
  meta: RequestMeta,
|}

export type RobotApiActionLike = {|
  type: string,
  payload: RobotApiRequest | RobotApiResponse,
  meta?: RequestMeta,
|}

// instance state shapes

export type RobotApiRequestState = {|
  response: RobotApiResponse | null,
|}

export type RobotInstanceNetworkingState = {
  [path: string]: ?RobotApiRequestState,
}

export type RobotInstanceResourcesState = {|
  health: HealthState,
  modules: ModulesState,
  pipettes: PipettesState,
  settings: SettingsState,
|}

export type RobotInstanceApiState = {|
  networking: RobotInstanceNetworkingState,
  resources: RobotInstanceResourcesState,
|}

// overall API state

export type RobotApiState = {
  [robotName: string]: ?RobotInstanceApiState,
}
