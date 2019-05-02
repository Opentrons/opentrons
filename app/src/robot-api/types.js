// @flow
export type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

// api call + response types

export type RobotHost = {
  name: string,
  ip: string,
  port: number,
}

export type ApiRequest = {|
  host: RobotHost,
  method: Method,
  path: string,
  body?: mixed,
|}

export type ApiResponse = {|
  host: RobotHost,
  path: string,
  method: Method,
  body: any,
  status: number,
  ok: boolean,
|}

// action types

export type ApiAction =
  | {| type: 'robotHttp:FETCH_HEALTH', payload: ApiRequest |}
  | {| type: 'robotHttp:FETCH_MODULES', payload: ApiRequest |}
  | {| type: 'robotHttp:FETCH_MODULE_DATA', payload: ApiRequest |}
  | {| type: 'robotHttp:SET_MODULE_TARGET_TEMP', payload: ApiRequest |}

export type ApiActionType = $PropertyType<ApiAction, 'type'>

// internal, request lifecycle types
// only for use inside observables
export type ApiRequestAction = {| type: string, payload: ApiRequest |}

export type ApiResponseAction = {| type: string, payload: ApiResponse |}

export type ApiErrorAction = {| type: string, payload: ApiResponse |}

export type ApiActionLike = {|
  type: string,
  payload: ApiRequest | ApiResponse,
|}

// resource types

export type HealthState = {|
  name: string,
  api_version: string,
  fw_version: string,
  logs: ?Array<string>,
|} | null

export type BaseModule = {|
  model: string,
  serial: string,
  fwVersion: string,
  status: string,
|}

export type TempDeckData = {|
  currentTemp: number,
  targetTemp: number,
|}

export type MagDeckData = {|
  engaged: boolean,
|}

export type TempDeckModule = {|
  ...BaseModule,
  name: 'tempdeck',
  displayName: 'Temperature Module',
  data: TempDeckData,
|}

export type MagDeckModule = {|
  ...BaseModule,
  name: 'magdeck',
  displayName: 'Magnetic Bead Module',
  data: MagDeckData,
|}

export type SetTemperatureRequest = {|
  command_type: 'set_temperature' | 'deactivate',
  args?: Array<number>,
|}

export type Module = MagDeckModule | TempDeckModule

// TODO(mc, 2019-04-25): normalize?
export type ModulesState = Array<Module>

// instance state shapes

export type NetworkingInstanceState = {
  [path: string]: {| inProgress: true |},
}

export type ApiInstanceState = {|
  health: HealthState,
  modules: ModulesState,
|}

export type RobotApiState = {|
  networking: NetworkingInstanceState,
  resources: ApiInstanceState,
|}

// overall API state

export type ApiState = {
  [robotName: string]: ?RobotApiState,
}
